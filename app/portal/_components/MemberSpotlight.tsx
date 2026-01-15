'use client';

export default function MemberSpotlight() {
  // TODO: Fetch random/featured member from Firestore
  const spotlightMember = {
    name: "James O.",
    role: "New Member",
    photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    quote: "Excited to join Rotaract to help with youth mentorship programs!"
  };

  return (
    <div className="bg-gradient-to-br from-rotaract-blue to-[#004280] rounded-xl shadow-md p-5 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-80">
            Member Spotlight
          </h3>
          <span className="material-symbols-outlined opacity-80 text-[18px]">star</span>
        </div>
        <div className="flex items-center gap-4 mb-3">
          <div 
            className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/10 bg-cover bg-center"
            style={{ backgroundImage: `url(${spotlightMember.photoURL})` }}
          />
          <div>
            <p className="font-bold text-lg leading-tight">{spotlightMember.name}</p>
            <p className="text-sm opacity-80">{spotlightMember.role}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed opacity-90 mb-4">
          "{spotlightMember.quote}"
        </p>
        <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors backdrop-blur-sm">
          Say Hello
        </button>
      </div>
    </div>
  );
}
