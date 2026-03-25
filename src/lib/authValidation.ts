export type AuthMode = "login" | "signup";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_DIGIT_PATTERN = /^\d{10,15}$/;

export function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email.trim());
}

export function isValidMobile(mobile: string) {
  const digitsOnly = mobile.replace(/\D/g, "");
  return MOBILE_DIGIT_PATTERN.test(digitsOnly);
}

export function validateAuthForm(input: {
  mode: AuthMode;
  email: string;
  password: string;
  name?: string;
  mobile?: string;
}) {
  const email = input.email.trim();
  const password = input.password;
  const name = (input.name || "").trim();
  const mobile = (input.mobile || "").trim();

  if (!email) {
    return "Please enter your email address.";
  }

  if (!isValidEmail(email)) {
    return "Please enter a valid email address.";
  }

  if (!password) {
    return "Please enter your password.";
  }

  if (input.mode === "signup") {
    if (!name) {
      return "Please enter your full name.";
    }

    if (!mobile) {
      return "Please enter your mobile number.";
    }

    if (!isValidMobile(mobile)) {
      return "Please enter a valid mobile number.";
    }
  }

  return "";
}
