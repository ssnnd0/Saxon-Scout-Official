import React, { FC } from 'react';

const NotFound: FC = () => (
  <div className="saxon-hero">
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="saxon-card">
        <div className="saxon-card-body text-center py-12">
          <div className="saxon-module-icon text-6xl mx-auto mb-6">
            <i className="fa fa-exclamation-triangle"></i>
          </div>
          <h1 className="saxon-hero-title mb-4">PAGE NOT FOUND</h1>
          <p className="saxon-hero-description mb-8">
            The requested page could not be found in the Saxon Scout system.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              className="saxon-btn text-xl px-8 py-4"
              onClick={() => window.history.back()}
            >
              <i className="fa fa-arrow-left mr-3"></i>
              GO BACK
            </button>
            <a 
              href="/" 
              className="saxon-btn-outline text-xl px-8 py-4"
            >
              <i className="fa fa-home mr-3"></i>
              RETURN TO HOME
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default NotFound;