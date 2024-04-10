const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());

let deliveryStatusHistory = [];

const trackingConnections = new Map();

app.get('/track-delivery/:trackingId', (req, res) => {
  const { trackingId } = req.params;

  console.log(`New Connection for tracking ID: ${trackingId}`);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const historyForTrackingId = deliveryStatusHistory.filter(status => status.trackingId === trackingId);
  if (historyForTrackingId.length > 0) {
    res.write(`data: ${JSON.stringify(historyForTrackingId)}\n\n`);
  }

  trackingConnections.set(trackingId, res);

  req.on('close', () => {
    trackingConnections.delete(trackingId);
  });
});

app.post('/update-delivery', (req, res) => {
  const { trackingId, status } = req.body;
  const newStatus = {
    trackingId,
    status,
    time: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
  };

  deliveryStatusHistory.push(newStatus);

  if (trackingConnections.has(trackingId)) {
    const sseConnection = trackingConnections.get(trackingId);
    sseConnection.write(`data: ${JSON.stringify([newStatus])}\n\n`);
  }

  res.json({ message: 'Delivery Status Updated' });
});

app.listen(port, () => {
  console.log(`Delivery Server is running at http://localhost:${port}`);
});
