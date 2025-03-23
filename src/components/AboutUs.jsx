import { Button } from "@heroui/react";
import { Link } from 'react-router-dom';

export const AboutUs = () => {
  return (
    <main className="flex-1 w-full bg-gradient-to-b from-white/30 via-gray-50/30 to-gray-100/30 relative overflow-hidden">
      <div className="absolute inset-0 w-full">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgba(99, 102, 241, 0.03)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,106.7C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          <path fill="rgba(168, 85, 247, 0.03)" d="M0,192L48,197.3C96,203,192,213,288,202.7C384,192,480,160,576,165.3C672,171,768,213,864,218.7C960,224,1056,192,1152,165.3C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
      <div className="relative px-6 lg:px-8">
        <div className="mx-auto max-w-7xl py-10 sm:py-32">
          {/* Mission Statement Section */}
          <div className="text-center mb-20">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-8">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                About Navigram
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Navigram was born from a simple yet powerful idea: to create a platform where people can capture and share their memories through photos, videos, and audio content, all tied to specific locations. Our mission is to build a global community of storytellers, preserving the rich multimedia experiences that make each place unique.
            </p>
          </div>

          {/* Key Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="relative p-8 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:bg-white/70 hover:scale-[1.02] group">
              <div className="absolute top-8 right-8 h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl opacity-75 transition-all duration-300 group-hover:scale-110 group-hover:opacity-90" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 transition-colors duration-300 group-hover:text-indigo-600">Multimedia Memories</h3>
                <p className="text-gray-600 text-lg leading-relaxed transition-colors duration-300 group-hover:text-gray-700">Capture life's moments through immersive photos, videos, and audio recordings, creating rich, multi-sensory stories.</p>
              </div>
            </div>
            <div className="relative p-8 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:bg-white/70 hover:scale-[1.02] group">
              <div className="absolute top-8 right-8 h-12 w-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl opacity-75 transition-all duration-300 group-hover:scale-110 group-hover:opacity-90" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 transition-colors duration-300 group-hover:text-indigo-600">Interactive Map</h3>
                <p className="text-gray-600 text-lg leading-relaxed transition-colors duration-300 group-hover:text-gray-700">Transform your world into an interactive story map, where every location holds your cherished memories and discoveries.</p>
              </div>
            </div>
            <div className="relative p-8 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:bg-white/70 hover:scale-[1.02] group">
              <div className="absolute top-8 right-8 h-12 w-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl opacity-75 transition-all duration-300 group-hover:scale-110 group-hover:opacity-90" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 transition-colors duration-300 group-hover:text-indigo-600">Global Community</h3>
                <p className="text-gray-600 text-lg leading-relaxed transition-colors duration-300 group-hover:text-gray-700">Join a worldwide community of storytellers, sharing experiences and discovering unique perspectives across the globe.</p>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
              Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
              We're a passionate team of developers, designers, and storytellers working together to create the best platform for sharing and preserving fond memories of certain places and moments in life. We're always looking for new ways to improve and expand our platform, so if you have any ideas or suggestions, we'd love to hear from you!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <img
                    src="https://avatars.githubusercontent.com/u/162428952?v=4"
                    alt="Jiv Tuban"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 hover:opacity-0 transition-opacity" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Jiv Tuban</h3>
                <p className="text-gray-600">Founder & CEO</p>
              </div>
              <div className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <img
                    src="https://avatars.githubusercontent.com/u/166014426?v=4"
                    alt="Aldrin Vitorillo"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 opacity-10 hover:opacity-0 transition-opacity" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Aldrin Vitorillo</h3>
                <p className="text-gray-600">Lead Developer</p>
              </div>
              <div className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <img
                    src="https://scontent.fceb1-3.fna.fbcdn.net/v/t1.6435-9/78210097_3159970630740440_5520602790201655296_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=f727a1&_nc_eui2=AeFCzBTGLdRrXPLfkOpYMJb3jGKAgRVs3bCMYoCBFWzdsNIGLPabBy1rCXPeWARMTYy0qSbvr3AV-An4jq74PUcu&_nc_ohc=yPNBrmBICqYQ7kNvgGbfk1V&_nc_zt=23&_nc_ht=scontent.fceb1-3.fna&_nc_gid=AEieu__bB4_EUGmwm99YRCe&oh=00_AYC6vUkWm8TP0Q8bl6kGYbLWre1X8OZx__h-euoys4Im5Q&oe=67B9A5D7"
                    alt="Kris Jan Yu"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 opacity-10 hover:opacity-0 transition-opacity" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Kris Jan Yu</h3>
                <p className="text-gray-600">Design Director</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Link to="/register">
              <Button className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:opacity-90 transition-all transform hover:scale-105 shadow-md">
                Join Our Community
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};