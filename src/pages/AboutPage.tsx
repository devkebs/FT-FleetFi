import React from 'react';
import { Page } from '../types';

interface AboutPageProps {
  onNavigate?: (page: Page) => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const handleGetStarted = () => {
    if (onNavigate) {
      onNavigate(Page.InvestorDashboard);
    }
  };

  const handleContactUs = () => {
    if (onNavigate) {
      onNavigate(Page.Contact);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Hero Section */}
      <section className="bg-dark text-white py-5">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-8 mx-auto text-center">
              <h1 className="display-3 fw-bold mb-4">Welcome to FleetFi</h1>
              <p className="lead fs-4 mb-2">
                Transform the Future of Transportation Through Fractional EV Fleet Ownership
              </p>
              <p className="fs-5 text-white-50">
                Invest in tokenized electric vehicle fleets, earn sustainable returns, and drive 
                the clean energy revolution—all from one intelligent platform combining blockchain 
                technology with real-world fleet operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-5">
        <div className="container py-4">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="icon-circle bg-primary bg-opacity-10 me-3">
                      <i className="bi bi-bullseye text-primary" style={{ fontSize: '32px' }}></i>
                    </div>
                    <h2 className="h3 mb-0">Our Mission</h2>
                  </div>
                  <p className="text-muted mb-0">
                    To make electric vehicle fleet ownership accessible to everyone through 
                    blockchain-powered tokenization, creating sustainable income opportunities 
                    while accelerating the transition to clean transportation in emerging markets.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="icon-circle bg-success bg-opacity-10 me-3">
                      <i className="bi bi-eye text-success" style={{ fontSize: '32px' }}></i>
                    </div>
                    <h2 className="h3 mb-0">Our Vision</h2>
                  </div>
                  <p className="text-muted mb-0">
                    A world where sustainable transportation is owned by communities, not corporations. 
                    Where everyday investors can participate in the green economy and earn fair returns 
                    while drivers build wealth and cities breathe cleaner air.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Story */}
      <section className="bg-white py-5">
        <div className="container py-4">
          <div className="row">
            <div className="col-lg-10 mx-auto">
              <div className="text-center mb-5">
                <h2 className="display-5 fw-bold mb-3">Our Story</h2>
                <p className="lead text-muted">From Vision to Reality</p>
              </div>
              
              <div className="timeline">
                <div className="timeline-item mb-4">
                  <div className="row">
                    <div className="col-md-3 text-md-end">
                      <h4 className="text-primary fw-bold">2024</h4>
                    </div>
                    <div className="col-md-9">
                      <div className="card border-start border-primary border-4 border-top-0 border-end-0 border-bottom-0">
                        <div className="card-body">
                          <h5 className="fw-bold">The Beginning</h5>
                          <p className="text-muted mb-0">
                            FleetFi was founded with a simple yet powerful idea: combine blockchain 
                            technology with electric vehicle fleets to create a new asset class accessible 
                            to retail investors. Our founders, experienced in fintech and sustainable 
                            transportation, saw an opportunity to democratize an industry traditionally 
                            dominated by large corporations.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="timeline-item mb-4">
                  <div className="row">
                    <div className="col-md-3 text-md-end">
                      <h4 className="text-primary fw-bold">Early 2025</h4>
                    </div>
                    <div className="col-md-9">
                      <div className="card border-start border-primary border-4 border-top-0 border-end-0 border-bottom-0">
                        <div className="card-body">
                          <h5 className="fw-bold">Technology Partnership</h5>
                          <p className="text-muted mb-0">
                            Partnered with TrovoTech to integrate SEC-compliant tokenization infrastructure, 
                            ensuring our platform meets regulatory requirements while providing seamless 
                            blockchain-powered fractional ownership. Integration with Bantu Network provides 
                            fast, low-cost transactions across Africa.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="timeline-item mb-4">
                  <div className="row">
                    <div className="col-md-3 text-md-end">
                      <h4 className="text-primary fw-bold">Mid 2025</h4>
                    </div>
                    <div className="col-md-9">
                      <div className="card border-start border-primary border-4 border-top-0 border-end-0 border-bottom-0">
                        <div className="card-body">
                          <h5 className="fw-bold">Platform Launch</h5>
                          <p className="text-muted mb-0">
                            Launched our MVP with core features: vehicle tokenization, real-time telemetry 
                            tracking, automated revenue distribution, and multi-role dashboards. Our first 
                            fleet of 40 electric vehicles began operations, serving riders across major cities.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="row">
                    <div className="col-md-3 text-md-end">
                      <h4 className="text-primary fw-bold">Today</h4>
                    </div>
                    <div className="col-md-9">
                      <div className="card border-start border-success border-4 border-top-0 border-end-0 border-bottom-0">
                        <div className="card-body">
                          <h5 className="fw-bold">Growing Impact</h5>
                          <p className="text-muted mb-0">
                            FleetFi continues to expand, connecting investors with sustainable transportation 
                            opportunities. Our platform processes thousands of rides monthly, distributing 
                            revenue fairly among stakeholders while reducing carbon emissions and creating 
                            economic opportunities in underserved communities.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-5">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Our Core Values</h2>
            <p className="lead text-muted">The principles that guide everything we do</p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body p-4">
                  <div className="icon-circle bg-primary bg-opacity-10 mx-auto mb-3">
                    <i className="bi bi-shield-check text-primary" style={{ fontSize: '40px' }}></i>
                  </div>
                  <h4 className="fw-bold mb-3">Transparency</h4>
                  <p className="text-muted mb-0">
                    Every transaction, every revenue split, every operational metric is visible 
                    and verifiable. Blockchain technology ensures immutable records and builds trust.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body p-4">
                  <div className="icon-circle bg-success bg-opacity-10 mx-auto mb-3">
                    <i className="bi bi-heart-fill text-success" style={{ fontSize: '40px' }}></i>
                  </div>
                  <h4 className="fw-bold mb-3">Fairness</h4>
                  <p className="text-muted mb-0">
                    Fair returns for investors, fair wages for drivers, fair prices for riders. 
                    Our 50/30/15/5 revenue split model ensures everyone benefits from success.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body p-4">
                  <div className="icon-circle bg-info bg-opacity-10 mx-auto mb-3">
                    <i className="bi bi-globe text-info" style={{ fontSize: '40px' }}></i>
                  </div>
                  <h4 className="fw-bold mb-3">Sustainability</h4>
                  <p className="text-muted mb-0">
                    100% electric vehicles, zero emissions, positive environmental impact. 
                    We're building the future of transportation, one clean mile at a time.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body p-4">
                  <div className="icon-circle bg-warning bg-opacity-10 mx-auto mb-3">
                    <i className="bi bi-lightbulb text-warning" style={{ fontSize: '40px' }}></i>
                  </div>
                  <h4 className="fw-bold mb-3">Innovation</h4>
                  <p className="text-muted mb-0">
                    Cutting-edge blockchain technology, real-time telemetry, automated systems. 
                    We embrace new technologies to create better solutions.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body p-4">
                  <div className="icon-circle bg-danger bg-opacity-10 mx-auto mb-3">
                    <i className="bi bi-people-fill text-danger" style={{ fontSize: '40px' }}></i>
                  </div>
                  <h4 className="fw-bold mb-3">Inclusivity</h4>
                  <p className="text-muted mb-0">
                    Investment opportunities for all, regardless of wealth. Fractional ownership 
                    makes premium assets accessible to everyday investors.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body p-4">
                  <div className="icon-circle bg-primary bg-opacity-10 mx-auto mb-3">
                    <i className="bi bi-graph-up-arrow text-primary" style={{ fontSize: '40px' }}></i>
                  </div>
                  <h4 className="fw-bold mb-3">Growth</h4>
                  <p className="text-muted mb-0">
                    Continuous improvement, expanding fleet, growing community. We're committed 
                    to scaling our impact while maintaining quality and values.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-dark text-white py-5">
        <div className="container py-4">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center">
              <h2 className="display-5 fw-bold mb-4">Join Our Mission</h2>
              <p className="lead mb-4">
                Whether you're an investor seeking sustainable returns, a driver looking for 
                fair opportunities, or simply someone who believes in a cleaner future, 
                there's a place for you in the FleetFi community.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <button onClick={handleGetStarted} className="btn btn-light btn-lg px-4">
                  Get Started
                </button>
                <button onClick={handleContactUs} className="btn btn-outline-light btn-lg px-4">
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .bg-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .timeline {
          position: relative;
        }

        .timeline-item {
          position: relative;
        }

        @media (max-width: 768px) {
          .timeline-item .col-md-3 {
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AboutPage;
