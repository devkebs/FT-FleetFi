import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InvestmentWizard from '../components/InvestmentWizard';

const mockAsset = {
  id: 'VEH001',
  type: 'EV',
  model: 'Tesla Model 3',
  value: 5000000,
  roi: 12.5,
  imageUrl: '/test-image.jpg',
};

describe('InvestmentWizard', () => {
  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders asset selection step initially', () => {
    render(
      <BrowserRouter>
        <InvestmentWizard
          isOpen={true}
          asset={mockAsset}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/select asset/i)).toBeInTheDocument();
  });

  it('displays asset information', () => {
    render(
      <BrowserRouter>
        <InvestmentWizard
          isOpen={true}
          asset={mockAsset}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Tesla Model 3')).toBeInTheDocument();
    expect(screen.getByText(/12.5%/)).toBeInTheDocument();
  });

  it('validates minimum investment amount', async () => {
    render(
      <BrowserRouter>
        <InvestmentWizard
          isOpen={true}
          asset={mockAsset}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      </BrowserRouter>
    );

    // Find investment amount input
    const amountInput = screen.getByLabelText(/investment amount/i);
    fireEvent.change(amountInput, { target: { value: '50' } });
    fireEvent.blur(amountInput);

    await waitFor(() => {
      // Should auto-correct to minimum 100
      expect(amountInput).toHaveValue(100);
    });
  });

  it('calculates ROI correctly', async () => {
    render(
      <BrowserRouter>
        <InvestmentWizard
          isOpen={true}
          asset={mockAsset}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      </BrowserRouter>
    );

    const amountInput = screen.getByLabelText(/investment amount/i);
    fireEvent.change(amountInput, { target: { value: '100000' } });

    await waitFor(() => {
      // ROI display should update (12.5% of 100000 = 12500)
      expect(screen.getByText(/₦12,500/)).toBeInTheDocument();
    });
  });

  it('progresses through wizard steps', async () => {
    render(
      <BrowserRouter>
        <InvestmentWizard
          isOpen={true}
          asset={mockAsset}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      </BrowserRouter>
    );

    // Step 1: Asset selection
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Step 2: Investment amount
    await waitFor(() => {
      expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    });
  });

  it('shows progress indicator', () => {
    render(
      <BrowserRouter>
        <InvestmentWizard
          isOpen={true}
          asset={mockAsset}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      </BrowserRouter>
    );

    // Progress bar or step indicator should be visible
    expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <BrowserRouter>
        <InvestmentWizard
          isOpen={true}
          asset={mockAsset}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      </BrowserRouter>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('displays confirmation screen on final step', async () => {
    render(
      <BrowserRouter>
        <InvestmentWizard
          isOpen={true}
          asset={mockAsset}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      </BrowserRouter>
    );

    // Navigate through all steps
    const amountInput = screen.getByLabelText(/investment amount/i);
    fireEvent.change(amountInput, { target: { value: '100000' } });

    for (let i = 0; i < 4; i++) {
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      await waitFor(() => {});
    }

    // Should show confirmation
    await waitFor(() => {
      expect(screen.getByText(/confirm/i)).toBeInTheDocument();
    });
  });
});
