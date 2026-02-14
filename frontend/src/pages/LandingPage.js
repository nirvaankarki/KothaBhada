import React from 'react';

const imgHero = 'http://localhost:3845/assets/92077500af0fe29e6cfaeeefd6be9fca60eefc8f.png';
const tick = 'http://localhost:3845/assets/cf89f4152a77bdc65bf6caf9a1cc5db3e6a08c87.svg';

export default function LandingPage(){
  return (
    <div className="bg-white text-[#1c1f3a]">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
        <div className="text-2xl font-extrabold">KothaBhada</div>
        <nav className="space-x-6">
          <a href="/" className="text-gray-600 hover:text-[#3a5aff]">Home</a>
          <a href="/login" className="text-gray-600 hover:text-[#3a5aff]">Login</a>
          <a href="/signup" className="text-gray-600 hover:text-[#3a5aff]">Signup</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <h1 className="font-extrabold text-[#1c1f3a] text-[48px] md:text-[56px] leading-tight">Find a place you'll love to live.</h1>
          <p className="text-gray-600 text-lg">Discover verified rooms with 3D views, refined filters, and instant support.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/signup" className="px-6 py-3 bg-[#3a5aff] text-white rounded-md shadow">Get Started</a>
            <a href="/login" className="px-6 py-3 border border-gray-300 rounded-md">Login</a>
          </div>

          {/* Search mock */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-4 max-w-xl">
            <div className="flex gap-3">
              <input className="flex-1 p-3 border border-gray-200 rounded" placeholder="Search location, price, amenities..." />
              <button className="px-4 bg-[#3a5aff] text-white rounded">Search</button>
            </div>
          </div>
        </div>

        <div>
          <img src={imgHero} alt="hero" className="w-full rounded-lg shadow-2xl" />
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-center font-extrabold text-[#1c1f3a] text-[60px]">HOW IT WORKS?</h2>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-8 justify-center">
          {[
            {
              title: 'Search, Filter, and View',
              items: ['Location-Based Search','Refined Filtering','3D Room Visualization','Immersive Exploration']
            },
            {
              title: 'AI Chatbot System',
              items: ['Instant Answers','Personalized Suggestions']
            },
            {
              title: 'Listing and Management',
              items: ['Property Owner Dashboard','3D Model Upload & Processing','Analytics']
            },
            {
              title: 'Verified Listings',
              items: ['Owner Verification','Quality Checks','Secure Payments']
            }
          ].map((card, idx) => (
            <div key={idx} className="bg-white border border-[rgba(28,31,58,0.08)] rounded-lg shadow-[2px_4px_5.2px_rgba(0,0,0,0.4)] overflow-hidden">
              <div className="bg-[#3a5aff] text-white p-4 text-center font-semibold">{card.title}</div>
              <div className="p-4 space-y-3">
                {card.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img src={tick} alt="tick" className="w-5 h-5" />
                    <span className="text-gray-600">{it}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-8 py-16 bg-gray-50">
        <h3 className="text-3xl font-bold text-center text-[#1c1f3a]">What our users say</h3>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {name: 'Anita Shrestha', text: 'Found a great room within a day. 3D view helped a lot.'},
            {name: 'Ramesh Thapa', text: 'Easy payments and verified owners.'},
            {name: 'Sita Gurung', text: 'Owner dashboard made listing simple.'}
          ].map((t,i)=> (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-gray-500">Verified tenant</div>
                </div>
              </div>
              <p className="mt-4 text-gray-600">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing / Plans */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <h3 className="text-3xl font-bold text-center text-[#1c1f3a]">Plans for everyone</h3>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[{title:'Basic',price:'Free',items:['Search & view','Contact owners']},{title:'Pro',price:'$9/mo',items:['3D view','Verified listings','Priority support']},{title:'Business',price:'$29/mo',items:['Owner dashboard','Analytics','Team accounts']}].map((p,i)=> (
            <div key={i} className="border p-6 rounded-lg text-center">
              <div className="text-xl font-semibold">{p.title}</div>
              <div className="text-3xl font-extrabold mt-3">{p.price}</div>
              <ul className="mt-4 space-y-2 text-gray-600">
                {p.items.map((it,idx)=> <li key={idx}>{it}</li>)}
              </ul>
              <button className="mt-6 px-6 py-2 bg-[#3a5aff] text-white rounded">Choose</button>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t mt-12 py-8">
        <div className="max-w-7xl mx-auto px-8 text-center text-gray-500">© 2026 KothaBhada</div>
      </footer>
    </div>
  );
}
