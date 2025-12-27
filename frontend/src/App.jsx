import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./auth/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

import RacesList from "./pages/RacesList";
import RaceDetails from "./pages/RaceDetails";
import RaceForm from "./pages/RaceForm";

import DriversList from "./pages/DriversList";
import DriverDetails from "./pages/DriverDetails";
import DriverForm from "./pages/DriverForm";

import EnrollmentsList from "./pages/EnrollmentsList";
import EnrollmentDetails from "./pages/EnrollmentDetails";
import UserForm from "./pages/UserForm";

import AdminUsers from "./pages/AdminUsers";

export default function App() {
    return (
        <div>
            <NavBar />
            <div style={{ padding: 16 }}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/races" element={<RacesList />} />
                    <Route path="/races/:id" element={<RaceDetails />} />
                    <Route path="/races/new" element={
                        <ProtectedRoute roles={["ADMIN"]}><RaceForm /></ProtectedRoute>
                    } />
                    <Route path="/races/:id/edit" element={
                        <ProtectedRoute roles={["ADMIN"]}><RaceForm /></ProtectedRoute>
                    } />

                    <Route path="/drivers" element={
                        <ProtectedRoute roles={["ADMIN","MANAGER","DRIVER"]}><DriversList /></ProtectedRoute>
                    } />
                    <Route path="/drivers/:id" element={
                        <ProtectedRoute roles={["ADMIN","MANAGER","DRIVER"]}><DriverDetails /></ProtectedRoute>
                    } />
                    <Route path="/drivers/new" element={
                        <ProtectedRoute roles={["ADMIN","MANAGER"]}><DriverForm /></ProtectedRoute>
                    } />
                    <Route path="/drivers/:id/edit" element={
                        <ProtectedRoute roles={["ADMIN","MANAGER"]}><DriverForm /></ProtectedRoute>
                    } />

                    <Route path="/enrollments" element={
                        <ProtectedRoute roles={["ADMIN","MANAGER","DRIVER"]}><EnrollmentsList /></ProtectedRoute>
                    } />
                    <Route path="/enrollments/:id" element={
                        <ProtectedRoute roles={["ADMIN","MANAGER","DRIVER"]}><EnrollmentDetails /></ProtectedRoute>
                    } />

                    <Route path="/admin/users/new" element={
                        <ProtectedRoute roles={["ADMIN"]}><UserForm /></ProtectedRoute>
                    } />

                    <Route path="/admin/users" element={
                        <ProtectedRoute roles={["ADMIN"]}><AdminUsers /></ProtectedRoute>
                    } />

                </Routes>
            </div>
        </div>
    );
}
