import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Box,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  PersonAdd,
  Event,
  QrCodeScanner,
  Logout,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVisitors: 0,
    activePasses: 0,
    todayAppointments: 0,
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [visitorsRes, passesRes, appointmentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/visitors'),
        axios.get('http://localhost:5000/api/passes'),
        axios.get('http://localhost:5000/api/appointments'),
      ]);

      setStats({
        totalVisitors: visitorsRes.data.length,
        activePasses: passesRes.data.filter(pass => pass.status === 'active').length,
        todayAppointments: appointmentsRes.data.filter(apt => {
          const today = new Date().toDateString();
          return new Date(apt.date).toDateString() === today;
        }).length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Add Visitor',
      icon: <PersonAdd />,
      description: 'Register a new visitor',
      path: '/visitors/new',
      color: '#4caf50',
    },
    {
      title: 'Schedule Appointment',
      icon: <Event />,
      description: 'Create a new appointment',
      path: '/appointments/new',
      color: '#2196f3',
    },
    {
      title: 'Scan QR Code',
      icon: <QrCodeScanner />,
      description: 'Scan visitor passes',
      path: '/scan',
      color: '#ff9800',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Visitor Pass Management
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {user?.name}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                backgroundColor: '#e3f2fd',
              }}
            >
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Total Visitors
              </Typography>
              <Typography component="p" variant="h4">
                {stats.totalVisitors}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                backgroundColor: '#e8f5e8',
              }}
            >
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Active Passes
              </Typography>
              <Typography component="p" variant="h4">
                {stats.activePasses}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                backgroundColor: '#fff3e0',
              }}
            >
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Today's Appointments
              </Typography>
              <Typography component="p" variant="h4">
                {stats.todayAppointments}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Quick Actions
        </Typography>

        <Grid container spacing={3}>
          {menuItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.title}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      color: item.color,
                    }}
                  >
                    {item.icon}
                    <Typography variant="h6" component="div" sx={{ ml: 1 }}>
                      {item.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => navigate(item.path)}
                  >
                    Go
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
