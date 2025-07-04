import React from 'react';
import ServiceCard from '../components/ServiceCard';
import { SERVICE_TRACKS } from '../../../constants/services';

const ServiceTracksSection = () => {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {SERVICE_TRACKS.map((track) => (
            <ServiceCard key={track.id} track={track} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceTracksSection; 