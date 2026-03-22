import { permanentRedirect } from "next/navigation";

/** 자가 가입 비활성화: 관리자가 계정을 발급합니다. */
export default function SignupRedirectPage() {
  permanentRedirect("/login");
}
