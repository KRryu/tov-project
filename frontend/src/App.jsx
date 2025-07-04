import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Services from './pages/Services/index';
import TOVspark from './pages/TOVspark';
import TOVplay from './pages/TOVplay';
import NotFound from './pages/NotFound';
import CreateChallenge from './pages/TOVspark/pages/CreateChallenge';
import ChallengeDetail from './pages/TOVspark/pages/ChallengeDetail';
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';
import Community from './pages/Community';
import Forum from './pages/Community/Forum';
import CountryGroups from './pages/Community/CountryGroups';
import ForumPostDetail from './pages/Community/Forum/components/ForumPostDetail';
import CountryGroupPostDetail from './pages/Community/CountryGroups/components/CountryGroupPostDetail';
import EventsPage from './pages/Community/Events/EventsPage';
import EventDetail from './pages/Community/Events/components/EventDetail';
import BridgeClub from './pages/Community/Bridge';
import VisaService from './pages/Services/VisaService';
import ApplicationTypeSelection from './pages/Services/VisaService/application/ApplicationTypeSelection';
import DynamicApplicationForm from './pages/Services/VisaService/application/DynamicApplicationForm';
import VisaApplicationComplete from './pages/Services/VisaService/complete';
import VisaApplication from './pages/Services/VisaService/application';
import E1EvaluationPageV3 from './pages/Services/VisaService/evaluation/E1EvaluationPageV3';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/tovspark" element={<TOVspark />} />
            <Route path="/tovplay" element={<TOVplay />} />
            <Route path="/tovspark/create-challenge" element={<CreateChallenge />} />
            <Route path="/tovspark/challenge/:challengeId" element={<ChallengeDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/community" element={<Community />}>
              <Route path="forum" element={<Forum />} />
              <Route path="forum/post/:postId" element={<ForumPostDetail />} />
              <Route path="country-groups" element={<CountryGroups />} />
              <Route path="country-groups/post/:postId" element={<CountryGroupPostDetail />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/:eventId" element={<EventDetail />} />
              <Route path="bridge" element={<BridgeClub />} />
            </Route>
            <Route path="/services/visa" element={<VisaService />} />
            <Route path="/services/visa/application" element={<ApplicationTypeSelection />} />
            <Route path="/services/visa/application/form" element={<DynamicApplicationForm />} />
            <Route path="/services/visa/evaluation/e1-v3" element={<E1EvaluationPageV3 />} />
            <Route path="/services/visa/complete" element={<VisaApplicationComplete />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <ToastContainer 
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;
