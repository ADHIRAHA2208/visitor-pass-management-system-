import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

const AppointmentForm = () => {
  const [visitors, setVisitors] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/visitors');
      setVisitors(response.data);
    } catch (error) {
      console.error('Error fetching visitors:', error);
    }
  };

  const validationSchema = Yup.object({
    visitorId: Yup.string().required('Visitor is required'),
    date: Yup.date().required('Date is required'),
    time: Yup.string().required('Time is required'),
    purpose: Yup.string().required('Purpose is required'),
    location: Yup.string().required('Location is required'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      setSuccess('');

      await axios.post('http://localhost:5000/api/appointments', values);

      setSuccess('Appointment scheduled successfully!');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to schedule appointment');
    } finally {
      setSubmitting(false);
    }
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
            Schedule Appointment
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Formik
            initialValues={{
              visitorId: '',
              date: new Date(),
              time: '',
              purpose: '',
              location: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, setFieldValue, values, isSubmitting }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={touched.visitorId && Boolean(errors.visitorId)}>
                      <InputLabel id="visitor-label">Visitor</InputLabel>
                      <Field
                        as={Select}
                        labelId="visitor-label"
                        id="visitorId"
                        name="visitorId"
                        label="Visitor"
                        value={values.visitorId}
                        onChange={(e) => setFieldValue('visitorId', e.target.value)}
                      >
                        {visitors.map((visitor) => (
                          <MenuItem key={visitor._id} value={visitor._id}>
                            {visitor.name} - {visitor.company}
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.visitorId && errors.visitorId && (
                        <Typography variant="caption" color="error">
                          {errors.visitorId}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Date
                      </Typography>
                      <DatePicker
                        selected={values.date}
                        onChange={(date) => setFieldValue('date', date)}
                        dateFormat="MMMM d, yyyy"
                        minDate={new Date()}
                        customInput={
                          <TextField
                            fullWidth
                            error={touched.date && Boolean(errors.date)}
                            helperText={touched.date && errors.date}
                          />
                        }
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      id="time"
                      name="time"
                      label="Time"
                      type="time"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        step: 300, // 5 min
                      }}
                      error={touched.time && Boolean(errors.time)}
                      helperText={touched.time && errors.time}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      id="location"
                      name="location"
                      label="Location"
                      error={touched.location && Boolean(errors.location)}
                      helperText={touched.location && errors.location}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      id="purpose"
                      name="purpose"
                      label="Purpose"
                      error={touched.purpose && Boolean(errors.purpose)}
                      helperText={touched.purpose && errors.purpose}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
};

export default AppointmentForm;
