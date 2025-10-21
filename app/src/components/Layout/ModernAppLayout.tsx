import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme as useMuiTheme,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Badge,
  Container,
  Paper
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Analytics as AnalyticsIcon,
  CloudDownload as CloudDownloadIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useTheme } from '../../components/ThemeProvider';
import { AppShellProps } from '../../types/navigation';

const drawerWidth = 240;

// Define theme type to fix implicit any errors
type Theme = {
  palette: {
    mode: string;
    background: {
      paper: string;
      default: string;
    };
    primary: {
      main: string;
    };
  };
  breakpoints: {
    up: (key: string | number) => string;
  };
  zIndex: {
    drawer: number;
    [key: string]: number;
  };
  transitions: {
    create: (props: string[], options?: any) => string;
    easing: {
      sharp: string;
      [key: string]: string;
    };
    duration: {
      leavingScreen: number;
      enteringScreen: number;
      [key: string]: number;
    };
  };
};

export const ModernAppLayout: React.FC<AppShellProps> = ({
  root,
  scouter,
  onLogout,
  isAdmin = false,
  children,
}) => {
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const { mode, toggleTheme } = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleProfileMenuClose();
    onLogout();
  };
  
  // Navigation items
  const navItems = [
    { path: '/', icon: <DashboardIcon />, label: 'Dashboard' },
    { path: '/quick', icon: <AssessmentIcon />, label: 'Match Scouting' },
    { path: '/pit', icon: <BuildIcon />, label: 'Pit Scouting' },
    { path: '/schedule', icon: <ScheduleIcon />, label: 'Event Schedule' },
    { path: '/alliance', icon: <GroupIcon />, label: 'Alliance Selection' },
    { path: '/analytics', icon: <AnalyticsIcon />, label: 'Analytics' },
    { path: '/export', icon: <CloudDownloadIcon />, label: 'Export Data' },
  ];
  
  // Admin items
  const adminItems = [
    { path: '/admin', icon: <AdminIcon />, label: 'Admin Portal' },
  ];
  
  // Settings item
  const settingsItem = { path: '/settings', icon: <SettingsIcon />, label: 'Settings' };
  
  // Check if current route is active
  const isActive = useCallback(
    (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path)),
    [location.pathname]
  );
  
  // Drawer content
  const drawerContent = (
    <>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: [1],
      }}>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Saxon Scout
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem 
            key={item.path}
            selected={isActive(item.path)}
            component="a" 
            href={item.path}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: isActive(item.path) ? 'inherit' : 'text.secondary',
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 1 }} />
      <List>
        {isAdmin && adminItems.map((item) => (
           <ListItem 
             key={item.path}
             selected={isActive(item.path)}
             component="a" 
             href={item.path}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'secondary.main',
                color: 'secondary.contrastText',
                '& .MuiListItemIcon-root': {
                  color: 'secondary.contrastText',
                },
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'secondary.dark',
              },
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: isActive(item.path) ? 'inherit' : 'text.secondary',
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
        <ListItem 
           key={settingsItem.path}
           selected={isActive(settingsItem.path)}
           component="a" 
           href={settingsItem.path}
          sx={{
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon sx={{ 
            minWidth: 40,
            color: isActive(settingsItem.path) ? 'primary.main' : 'text.secondary',
          }}>
            {settingsItem.icon}
          </ListItemIcon>
          <ListItemText primary={settingsItem.label} />
        </ListItem>
      </List>
    </>
  );
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={(theme: Theme) => ({
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(drawerOpen && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        })}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              marginRight: 2,
              ...(drawerOpen && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Saxon Scout
          </Typography>
          
          <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              color="inherit"
            >
              <Badge color="secondary" variant="dot" invisible={!isAdmin}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: isAdmin ? 'secondary.main' : 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                Signed in as <strong>{scouter}</strong>
              </Typography>
            </MenuItem>
            <Divider />
            {isAdmin && (
              <MenuItem component="a" href="/admin">
                <ListItemIcon>
                  <AdminIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Admin Portal</ListItemText>
              </MenuItem>
            )}
            <MenuItem component="a" href="/settings">
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={drawerOpen}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={(theme: Theme) => ({
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`,
          },
        })}
      >
        {drawerContent}
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          ml: { sm: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: (theme) =>
            theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            {children}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default ModernAppLayout;