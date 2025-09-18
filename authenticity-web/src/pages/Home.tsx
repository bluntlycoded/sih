import React from "react";
import { ShieldCheck, GraduationCap, Building2, Users } from "lucide-react";

export default function Home() {
  const features = [
    {
      title: "Students",
      desc: "View and share your verified academic certificates with ease.",
      icon: GraduationCap,
    },
    {
      title: "Universities",
      desc: "Issue tamper-proof certificates securely to students.",
      icon: Building2,
    },
    {
      title: "Admins",
      desc: "Manage institutions, users, and certificate policies centrally.",
      icon: Users,
    },
    {
      title: "Public",
      desc: "Verify any certificate instantly using its unique ID.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white px-6 py-12">
      <div className="mx-auto max-w-5xl text-center">
        {/* Hero Section */}
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Authenticity Validator
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Verify, issue, and manage academic certificates across institutions.
        </p>
      </div>

      {/* Features Grid */}
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
        {features.map((f, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-all duration-300"
          >
            <f.icon className="h-10 w-10 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
