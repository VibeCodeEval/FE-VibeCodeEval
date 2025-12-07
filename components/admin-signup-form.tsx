"use client"

import type React from "react"

import { useState } from "react"

import { useRouter } from "next/navigation";

export default function AdminSignupForm() {
  const [formData, setFormData] = useState({
    adminName: "",
    email: "",
    secretKey: "",
    password: "",
    confirmPassword: "",
  })


  const router = useRouter();


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle signup logic
    console.log("Form submitted:", formData)

    router.push("/"); // 로그인 화면 경로
  }

  const handleVerifyEmail = () => {
    // Handle email verification
    console.log("Verifying email:", formData.email)
  }

  return (
    <div className="w-full max-w-[450px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10">
      {/* Header */}
      <h1 className="text-xl font-semibold text-center text-gray-900">관리자 회원가입</h1>
      <div className="mt-5 mb-8 h-px bg-gray-200" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Admin Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">관리자 이름</label>
          <input
            type="text"
            name="adminName"
            placeholder="이름을 입력하세요"
            value={formData.adminName}
            onChange={handleChange}
            className="w-full h-11 px-3.5 border border-[#DDDDDD] rounded-[10px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
          />
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">이메일 주소</label>
          <div className="relative flex items-center">
            <input
              type="email"
              name="email"
              placeholder="이메일 주소를 입력하세요"
              value={formData.email}
              onChange={handleChange}
              className="w-full h-11 px-3.5 pr-24 border border-[#DDDDDD] rounded-[10px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
            />
          
          </div>
        </div>

        {/* Admin Secret Key */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">관리자 시크릿 키</label>
          <input
            type="password"
            name="secretKey"
            placeholder="발급받은 시크릿 키를 입력하세요"
            value={formData.secretKey}
            onChange={handleChange}
            className="w-full h-11 px-3.5 border border-[#DDDDDD] rounded-[10px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">비밀번호</label>
          <input
            type="password"
            name="password"
            placeholder="비밀번호를 설정하세요"
            value={formData.password}
            onChange={handleChange}
            className="w-full h-11 px-3.5 border border-[#DDDDDD] rounded-[10px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="비밀번호를 다시 입력하세요"
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
          회원가입
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-gray-500">
        이미 관리자 계정이 있으신가요?{" "}
        <a href="/" className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
          로그인하기
        </a>
      </p>
    </div>
  )
}
