
export default function AppBackground() {
  return (
    <div className="fixed inset-0 -z-50 pointer-events-none">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 h-full w-full bg-[#000000] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Gradient Orbs */}
      <div className="absolute left-0 right-0 top-0 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
      <div className="absolute right-0 bottom-0 h-[310px] w-[310px] rounded-full bg-purple-500 opacity-20 blur-[100px]"></div>
    </div>
  );
}
