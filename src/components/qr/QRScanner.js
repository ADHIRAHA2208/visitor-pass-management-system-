import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import QrReader from 'react-qr-scanner';
import axios from 'axios';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleScan = async (data) => {
    if (data && data.text) {
      setScanning(false);
      try {
        // Assuming the QR code contains the pass ID
        const passId = data.text;
        const response = await axios.get(`http://localhost:5000/api/passes/${passId}`);
        setScanResult(response.data);
        setDialogOpen(true);
      } catch (error) {
        setError('Invalid QR code or pass not found');
        setScanning(true);
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError('Error accessing camera');
  };

  const handleCheckIn = async () => {
    try {
      await axios.post(`http://localhost:5000/api/checklogs`, {
        passId: scanResult._id,
        type: 'checkin',
      });
      setDialogOpen(false);
      setScanResult(null);
      setScanning(true);
      alert('Check-in successful!');
    } catch (error) {
      setError('Failed to check in visitor');
    }
  };

  const handleCheckOut = async () => {
    try {
      await axios.post(`http://localhost:5000/api/checklogs`, {
        passId: scanResult._id,
        type: 'checkout',
      });
      setDialogOpen(false);
      setScanResult(null);
      setScanning(true);
      alert('Check-out successful!');
    } catch (error) {
      setError('Failed to check out visitor');
    }
  };

  const previewStyle = {
    height: 400,
    width: 400,
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            QR Code Scanner
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            {scanning ? (
              <QrReader
                delay={300}
                style={previewStyle}
                onError={handleError}
                onScan={handleScan}
              />
            ) : (
              <Box sx={{ height: 400, width: 400, bgcolor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Scan complete</Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Back to Dashboard
            </Button>
            {!scanning && (
              <Button
                variant="contained"
                onClick={() => {
                  setScanning(true);
                  setScanResult(null);
                  setError('');
                }}
              >
                Scan Again
              </Button>
            )}
          </Box>
        </Paper>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Visitor Pass Details</DialogTitle>
        <DialogContent>
          {scanResult && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {scanResult.visitor?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Company: {scanResult.visitor?.company}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Purpose: {scanResult.purpose}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valid From: {new Date(scanResult.validFrom).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valid Until: {new Date(scanResult.validUntil).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {scanResult.status}
                </Typography>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          {scanResult?.status === 'active' && (
            <>
              <Button onClick={handleCheckIn} color="primary">
                Check In
              </Button>
              <Button onClick={handleCheckOut} color="secondary">
                Check Out
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QRScanner;
