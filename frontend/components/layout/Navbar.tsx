"use client";

export default function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const changeLanguage = (lang: string) => {
    localStorage.setItem("lang", lang);
    window.location.reload();
  };

  return (
    <div className="p-4 bg-blue-500 text-white flex justify-between items-center">
      
      {/* Logo */}
      <h1 className="font-bold text-lg">Contract Platform</h1>

      {/* Right Side */}
      <div className="flex gap-2 items-center">
        
        <button
          onClick={() => changeLanguage("en")}
          className="bg-white text-black px-3 py-1 rounded"
        >
          EN
        </button>

        <button
          onClick={() => changeLanguage("ar")}
          className="bg-white text-black px-3 py-1 rounded"
        >
          AR
        </button>

        <button
          onClick={handleLogout}
          className="bg-red-500 px-3 py-1 rounded"
        >
          Logout
        </button>

      </div>
    </div>
  );
}