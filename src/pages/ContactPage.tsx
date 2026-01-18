import React, { useState } from 'react';
import { Page } from '../types';
import { submitContactForm, ContactFormData } from '../services/api';

interface ContactPageProps {
  onNavigate?: (page: Page) => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const contactData: ContactFormData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject as ContactFormData['subject'],
        message: formData.message,
      };

      await submitContactForm(contactData);
      setSubmitted(true);

      // Reset form after 5 seconds
      setTimeout(() => {
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        setSubmitted(false);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToAbout = () => {
    if (onNavigate) {
      onNavigate(Page.About);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Hero Section */}
      <section className="bg-dark text-white py-5">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-8 mx-auto text-center">
              <h1 className="display-4 fw-bold mb-4">Get in Touch</h1>
              <p className="lead fs-4 mb-0">
                Have questions? We'd love to hear from you. Reach out to the FleetFi team anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-5">
        <div className="container py-4">
          <div className="row g-4 mb-5">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm text-center h-100">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <i className="bi bi-envelope text-primary" style={{ fontSize: '32px' }}></i>
                  </div>
                  <h5 className="card-title">Email</h5>
                  <p className="text-muted">
                    <a href="mailto:support@fleetfi.com" className="text-decoration-none">
                      support@fleetfi.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm text-center h-100">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <i className="bi bi-telephone text-primary" style={{ fontSize: '32px' }}></i>
                  </div>
                  <h5 className="card-title">Phone</h5>
                  <p className="text-muted">
                    <a href="tel:+234803123456" className="text-decoration-none">
                      +234 (803) 123-456
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm text-center h-100">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <i className="bi bi-geo-alt text-primary" style={{ fontSize: '32px' }}></i>
                  </div>
                  <h5 className="card-title">Location</h5>
                  <p className="text-muted">
                    Ilorin, Nigeria
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="row">
            <div className="col-lg-6 mx-auto">
              <div className="card border-0 shadow-lg">
                <div className="card-body p-5">
                  <h3 className="card-title mb-4">Send us a Message</h3>
                  
                  {submitted && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                      <i className="bi bi-check-circle me-2"></i>
                      Thank you! We've received your message and will get back to you soon.
                    </div>
                  )}

                  {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                      <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="subject" className="form-label">Subject *</label>
                      <select
                        className="form-select"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select a subject...</option>
                        <option value="investment">Investment Inquiry</option>
                        <option value="operator">Operator Partnership</option>
                        <option value="driver">Driver Opportunity</option>
                        <option value="support">Technical Support</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="message" className="form-label">Message *</label>
                      <textarea
                        className="form-control"
                        id="message"
                        name="message"
                        rows={5}
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100 mb-3"
                      disabled={submitting || submitted}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending...
                        </>
                      ) : submitted ? (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Message Sent!
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                    <button type="button" onClick={handleBackToAbout} className="btn btn-outline-secondary w-100">
                      Back to About
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="row mb-4">
            <div className="col-lg-8 mx-auto text-center">
              <h2 className="h2 fw-bold mb-3">Frequently Asked Questions</h2>
              <p className="text-muted">Find quick answers to common questions</p>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="accordion" id="faqAccordion">
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                      How do I get started with FleetFi?
                    </button>
                  </h2>
                  <div id="faq1" className="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Simply sign up on our platform, complete KYC verification, and you can start investing in EV fleet assets immediately.
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                      What is the minimum investment amount?
                    </button>
                  </h2>
                  <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      You can start investing with as little as ₦10,000 through tokenized asset fractions.
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                      How are returns distributed?
                    </button>
                  </h2>
                  <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Returns are automatically distributed monthly based on your ownership percentage and platform revenue from fleet operations.
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">
                      Is FleetFi secure?
                    </button>
                  </h2>
                  <div id="faq4" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Yes, we use blockchain technology, encrypted wallets, and Stellar SDK for secure asset management and transactions.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
