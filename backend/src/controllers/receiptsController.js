import axios from 'axios';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const uploadMiddleware = upload.single('file');

function getEnv() {
  const endpoint = process.env.AZURE_DI_ENDPOINT;
  const key = process.env.AZURE_DI_KEY;
  const model = process.env.AZURE_DI_MODEL || 'prebuilt-receipt';
  const apiVersion = process.env.AZURE_DI_API_VERSION || '2023-07-31';
  if (!endpoint || !key) {
    throw new Error('Azure Document Intelligence credentials are not configured');
  }
  return { endpoint, key, model, apiVersion };
}

async function analyzeWithAzure(buffer, contentType) {
  const { endpoint, key, model, apiVersion } = getEnv();
  const url = `${endpoint.replace(/\/$/, '')}/formrecognizer/documentModels/${encodeURIComponent(model)}:analyze?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/octet-stream',
    'Ocp-Apim-Subscription-Key': key,
  };

  // Some API versions return result directly; older ones return Operation-Location to poll
  const res = await axios.post(url, buffer, { headers, validateStatus: () => true });

  if (res.status === 200 && res.data) {
    return res.data;
  }
  if (res.status === 202 && res.headers['operation-location']) {
    const pollUrl = res.headers['operation-location'];
    // Poll until succeeded or timeout
    const started = Date.now();
    while (Date.now() - started < 60000) {
      await new Promise((r) => setTimeout(r, 1000));
      const pr = await axios.get(pollUrl, { headers: { 'Ocp-Apim-Subscription-Key': key } });
      const status = pr.data?.status || pr.data?.analyzeResult?.status;
      if (status === 'succeeded') return pr.data;
      if (status === 'failed') throw new Error('Azure analysis failed');
    }
    throw new Error('Azure analysis timed out');
  }
  throw new Error(`Azure analysis error: ${res.status}`);
}

function extractReceiptFields(result) {
  // Normalize across possible shapes and handle multi-page/multi-document outputs
  const analyzeResult = result?.analyzeResult || result;
  const docs = Array.isArray(analyzeResult?.documents) ? analyzeResult.documents : [];

  let merchantName = null;
  let transactionDate = null;
  let totals = [];
  const items = [];

  for (const doc of docs) {
    const fields = doc?.fields || {};
    const docMerchant = fields.MerchantName?.valueString || fields.MerchantName?.content || null;
    const docDate = fields.TransactionDate?.valueDate || fields.TransactionDate?.content || null;
    const docTotal = fields.Total?.valueCurrency?.amount ?? fields.Total?.valueNumber ?? null;

    if (docMerchant) merchantName = merchantName || docMerchant; // keep first non-empty
    if (docDate) {
      try {
        const d = new Date(docDate);
        if (!transactionDate || d < new Date(transactionDate)) transactionDate = d.toISOString();
      } catch (_) {
        // ignore parse errors
        transactionDate = transactionDate || docDate;
      }
    }
    if (typeof docTotal === 'number') totals.push(docTotal);

    if (Array.isArray(fields.Items?.valueArray)) {
      for (const it of fields.Items.valueArray) {
        const f = it?.valueObject?.properties || it?.valueObject || {};
        const desc = f.Description?.valueString || f.Description?.content || '';
        const amount = f.TotalPrice?.valueCurrency?.amount ?? f.TotalPrice?.valueNumber ?? null;
        if (desc || typeof amount === 'number') {
          items.push({ description: desc, amount });
        }
      }
    }
  }

  // Fallbacks if documents array is empty but analyzeResult has a single doc-like shape
  if (!docs.length && analyzeResult?.documents?.length === 0 && analyzeResult?.content) {
    // Leave as empty; client will handle manual entry
  }

  // Prefer sum of item amounts if available; else sum of doc totals; else null
  let total = null;
  if (items.length && items.every((i) => typeof i.amount === 'number')) {
    total = items.reduce((s, i) => s + i.amount, 0);
  } else if (totals.length) {
    total = totals.reduce((a, b) => a + b, 0);
  }

  return { transactionDate, total, merchantName, items };
}

export async function analyzeReceipt(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const contentType = req.file.mimetype || 'application/octet-stream';
    const result = await analyzeWithAzure(req.file.buffer, contentType);
    const extracted = extractReceiptFields(result);
    return res.json({ extracted });
  } catch (err) {
    next(err);
  }
}
