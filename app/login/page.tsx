"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth/actions";
import { Lock } from "lucide-react";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#C5A880] rounded-2xl flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#111827]">
          IEO Admin
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          관리자 계정으로 로그인해주세요
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-6" action={formAction}>
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-gray-700">
                아이디
              </label>
              <div className="mt-1">
                <input
                  id="id"
                  name="id"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#C5A880] focus:border-[#C5A880] sm:text-sm"
                  placeholder="아이디를 입력하세요"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#C5A880] focus:border-[#C5A880] sm:text-sm"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
            </div>

            {state?.error && (
              <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                {state.error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={pending}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#111827] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#111827] disabled:opacity-50 transition-colors"
              >
                {pending ? "로그인 중..." : "로그인"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
