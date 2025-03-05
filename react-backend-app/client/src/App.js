"use client"

import { useEffect, useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import JamRoomFinder from "./JamRoomFinder"
import JamRoomDetails from "./components/JamRoomDetails"
import Booking from "./components/Booking"
import FinalReview from "./components/FinalReview"
import BookingConfirmation from "./components/BookingConfirmation"
import {
  Button,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  CircularProgress,
} from "@mui/material"
import { LogOut, User } from "lucide-react"

function App() {
  const { loginWithRedirect, logout, isAuthenticated, isLoading, user, getIdTokenClaims } = useAuth0()
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  useEffect(() => {
    const registerUser = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await fetch("http://localhost:5000/api/users/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: user.name || "NA",
              email: user.email,
              mobileNumber: user.phone_number || "",
            }),
          })

          const data = await response.json()
          if (!data.success) {
            console.error("Error registering user:", data.message)
          }
        } catch (error) {
          console.error("Error registering user:", error)
        }
      }
    }

    registerUser()
  }, [isAuthenticated, user])

  const handleLogin = () => {
    loginWithRedirect()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <CircularProgress color="primary" />
      </div>
    )
  }

  return (
    <>
      <AppBar position="static" color="default" elevation={1} className="bg-white">
        <Toolbar className="justify-between">
          <Typography variant="h6" className="font-bold text-indigo-600">
            JamRoom
          </Typography>

          {isAuthenticated && user ? (
            <div>
              <IconButton
                onClick={handleMenuClick}
                size="small"
                aria-controls={open ? "account-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
              >
                <Avatar src={user.picture} alt={user.name} className="w-8 h-8">
                  {user.name?.charAt(0) || "U"}
                </Avatar>
              </IconButton>
              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem disabled className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <div className="flex flex-col">
                    <Typography variant="body2" className="font-medium">
                      {user.name}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500">
                      {user.email}
                    </Typography>
                  </div>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleMenuClose()
                    logout({ returnTo: window.location.origin })
                  }}
                  className="text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </MenuItem>
              </Menu>
            </div>
          ) : (
            <Button variant="contained" color="primary" onClick={handleLogin} size="small">
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Router>
        <Routes>
          <Route path="/" element={<JamRoomFinder />} />
          <Route path="/jam-room/:id" element={<JamRoomDetails />} />
          <Route path="/booking/:id" element={<Booking />} />
          <Route path="/final-review" element={<FinalReview />} />
          <Route path="/confirmation/:id" element={<BookingConfirmation />} />
        </Routes>
      </Router>
    </>
  )
}

export default App

