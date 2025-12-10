"use client"

import type React from "react"

import { useState } from "react"

import { useRouter } from "next/navigation";
import { signUpAdmin, LoginFailedError, NetworkError } from "@/lib/api/admin"
import { useToast } from "@/hooks/use-toast"

export default function AdminSignupForm() {
  const [formData, setFormData] = useState({
    adminNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter();
  const { toast } = useToast()


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("") // 입력 시 에러 메시지 초기화
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // 입력값 검증
    if (!formData.adminNumber.trim()) {
      setError("관리자 번호를 입력해주세요.")
      return
    }
    if (!formData.email.trim()) {
      setError("이메일을 입력해주세요.")
      return
    }
    if (!formData.password.trim()) {
      setError("비밀번호를 입력해주세요.")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }
    if (formData.password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.")
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      setError("올바른 이메일 형식을 입력해주세요.")
      return
    }

    setIsLoading(true)
    try {
      await signUpAdmin({
        adminNumber: formData.adminNumber.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
      })

      toast({
        title: "회원가입 성공",
        description: "관리자 계정이 성공적으로 생성되었습니다. 로그인해주세요.",
      })

      // 성공 시 로그인 페이지로 이동
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (error) {
      if (error instanceof LoginFailedError) {
        setError(error.message)
      } else if (error instanceof NetworkError) {
        setError(error.message)
      } else {
        setError("회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[450px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10">
      {/* Header */}
      <h1 className="text-xl font-semibold text-center text-gray-900">관리자 회원가입</h1>
      <div className="mt-5 mb-8 h-px bg-gray-200" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Admin Number */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">관리자 번호</label>
          <input
            type="text"
            name="adminNumber"
            placeholder="발급받은 관리자 번호를 입력하세요"
            value={formData.adminNumber}
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
              className="w-full h-11 px-3.5 border border-[#DDDDDD] rounded-[10px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">비밀번호</label>
          <input
            type="password"
            name="password"
            placeholder="비밀번호를 설정하세요 (최소 8자)"
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

        {/* Error Message */}
        {error && (
          <div className="mt-2">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 mt-3 bg-white border border-[#D0D0D0] rounded-[10px] text-sm font-medium text-gray-900 hover:bg-gray-50 hover:border-gray-400 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "회원가입 중..." : "회원가입"}
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
