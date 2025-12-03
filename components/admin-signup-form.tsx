"use client"

import type React from "react"

import { useState } from "react"

export default function AdminSignupForm() {
  const [formData, setFormData] = useState({
    adminName: "",
    email: "",
    verificationCode: "",
    secretKey: "",
    password: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle signup logic
    console.log("Form submitted:", formData)
  }

  const handleVerifyEmail = () => {
    // Handle email verification
    console.log("Verifying email:", formData.email)
  }

  return (
    <div className="w-full max-w-[450px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10">
      {/* Header */}
      <h1 className="text-xl font-semibold text-center text-gray-900">Admin Signup</h1>
      <div className="mt-5 mb-8 h-px bg-gray-200" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Admin Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Admin Name</label>
          <input
            type="text"
            name="adminName"
            placeholder="Enter your full name"
            value={formData.adminName}
            onChange={handleChange}
            className="w-full h-11 px-3.5 border border-[#DDDDDD] rounded-[10px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
          />
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <div className="relative flex items-center">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full h-11 px-3.5 pr-24 border border-[#DDDDDD] rounded-[10px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
            />
            <button
              type="button"
              onClick={handleVerifyEmail}
              className="absolute right-3 text-xs font-medium text-gray-500 hover:text-gray-800 hover:underline transition-all cursor-pointer"
            >
              Verify Email
            </button>
          </div>
        </div>

        {/* Verification Code */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Verification Code</label>
          <input
            type="text"
            name="verificationCode"
            placeholder="Enter invitation code"
            value={formData.verificationCode}
            onChange={handleChange}
            className="w-full h-11 px-3.5 border border-[#DDDDDD] rounded-[10px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
          />
        </div>

        {/* Admin Secret Key */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Admin Secret Key</label>
          <input
            type="password"
            name="secretKey"
            placeholder="Enter your admin Secret Key"
            value={formData.secretKey}
            onChange={handleChange}
            className="w-full h-11 px-3.5 border border-[#DDDDDD] rounded-[10px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Set your password"
            value={formData.password}
            onChange={handleChange}
            className="w-full h-11 px-3.5 border border-[#DDDDDD] rounded-[10px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full h-11 px-3.5 border border-[#DDDDDD] rounded-[10px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full h-11 mt-3 bg-white border border-[#D0D0D0] rounded-[10px] text-sm font-medium text-gray-900 hover:bg-gray-50 hover:border-gray-400 active:scale-[0.99] transition-all"
        >
          Sign Up
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-gray-500">
        Already have an account?{" "}
        <a href="/" className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
          Log in
        </a>
      </p>
    </div>
  )
}
