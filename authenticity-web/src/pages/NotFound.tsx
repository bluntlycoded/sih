
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F6FF] px-6 text-center">
      {/* Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#4FB7B3]/10 mb-6">
        <AlertTriangle className="h-10 w-10 text-[#EB8317]" />
      </div>

      {/* Title */}
      <h1 className="text-6xl font-extrabold text-[#EB8317]">404</h1>
      <p className="mt-4 text-xl font-semibold text-[#10375C]">
        Oops! Page Not Found
      </p>
      <p className="mt-2 text-[#10375C]/70 max-w-md">
        The page you’re looking for doesn’t exist or has been moved. Don’t worry — you
        can always return safely to the homepage.
      </p>

      {/* Button */}
      <Link
        to="/"
        className="mt-8 inline-flex items-center rounded-lg bg-[#4FB7B3] px-6 py-3 text-sm font-medium text-white shadow-md transition hover:bg-[#3AA29E]"
      >
        Go Back Home
      </Link>

      {/* Decorative Background */}
      <div className="absolute -z-10 inset-0 flex justify-center items-center">
        <div className="h-[400px] w-[400px] rounded-full bg-[#4FB7B3]/10 blur-3xl" />
      </div>
    </div>
  );
}
