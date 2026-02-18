// import React from 'react';
// import Footer from '../components/Footer';
// import AboutUs from '../components/AboutUs';
// import OurMission from '../components/OurMission';
// import bgImage from '../assets/aboutPage-Bg-Img.jpg';

// const AboutPage = () => {
//   return (
//     <div className="min-h-screen flex flex-col">

//     <main 
//         className="flex-grow bg-repeat" 
//         style={{ backgroundImage: `url(${bgImage})` }}
//       >


//       <AboutUs />
//       <OurMission />
//       <Footer />
//     </main>

//     </div>
//   );
// };
// export default AboutPage;

import React from 'react';
import Footer from '../components/Footer';
import AboutUs from '../components/AboutUs';
import OurMission from '../components/OurMission';
import bgImage from '../assets/aboutPage-Bg-Img.jpg';

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col">

      {/* 2. Main wrapper for content with the shared background */}
      <main 
        className="flex-grow bg-repeat bg-center" 
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <AboutUs />
        <OurMission />
        
        {/* You can add "Our Vision" or "Team" sections here later */}
      </main>
    </div>
  );
};

export default AboutPage;