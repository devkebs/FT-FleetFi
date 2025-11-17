import React, { useState } from 'react';
import { Modal, Button, Alert, Form, InputGroup } from 'react-bootstrap';
import { Copy, Download, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { 
  copyToClipboard, 
  downloadAsFile, 
  WALLET_SECURITY_TIPS 
} from '../services/stellarWallet';

interface SecretKeyModalProps {
  show: boolean;
  secretKey: string;
  publicKey: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SecretKeyModal: React.FC<SecretKeyModalProps> = ({
  show,
  secretKey,
  publicKey,
  onConfirm,
  onCancel
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(secretKey);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const content = `FleetFi Wallet Credentials
Generated: ${new Date().toISOString()}

PUBLIC KEY (Wallet Address):
${publicKey}

SECRET KEY (KEEP THIS SAFE!):
${secretKey}

IMPORTANT SECURITY NOTES:
- Never share your secret key with anyone
- Store this file in a secure location
- Make backup copies
- If you lose your secret key, you lose access to your wallet forever
- FleetFi will never ask for your secret key

Your public key is your wallet address and is safe to share.
`;
    downloadAsFile(content, `fleetfi-wallet-${Date.now()}.txt`);
  };

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
    }
  };

  return (
    <Modal show={show} onHide={onCancel} size="lg" backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title className="d-flex align-items-center gap-2">
          <AlertTriangle className="text-warning" size={24} />
          Save Your Secret Key
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>⚠️ Critical: This Will Only Be Shown Once!</Alert.Heading>
          <p className="mb-0">
            Your secret key will never be displayed again. Make sure to save it securely before continuing.
          </p>
        </Alert>

        {/* Public Key */}
        <div className="mb-4">
          <label className="form-label fw-bold">Public Key (Wallet Address)</label>
          <p className="text-muted small mb-2">This is your wallet address - safe to share</p>
          <InputGroup>
            <Form.Control
              type="text"
              value={publicKey}
              readOnly
              className="font-monospace"
            />
            <Button
              variant="outline-secondary"
              onClick={() => copyToClipboard(publicKey)}
            >
              <Copy size={16} />
            </Button>
          </InputGroup>
        </div>

        {/* Secret Key */}
        <div className="mb-4">
          <label className="form-label fw-bold text-danger">Secret Key (NEVER SHARE THIS!)</label>
          <p className="text-muted small mb-2">Keep this safe - you'll need it to access your wallet</p>
          <InputGroup>
            <Form.Control
              type={showSecret ? 'text' : 'password'}
              value={secretKey}
              readOnly
              className="font-monospace"
            />
            <Button
              variant="outline-secondary"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
            <Button
              variant="outline-primary"
              onClick={handleCopy}
            >
              {copied ? '✓ Copied!' : <Copy size={16} />}
            </Button>
          </InputGroup>
        </div>

        {/* Action Buttons */}
        <div className="mb-4">
          <Button
            variant="success"
            onClick={handleDownload}
            className="w-100 mb-2"
          >
            <Download size={16} className="me-2" />
            Download as Text File
          </Button>
        </div>

        {/* Security Tips */}
        <div className="bg-light p-3 rounded mb-4">
          <h6 className="fw-bold mb-3">Security Recommendations:</h6>
          <ul className="mb-0 small">
            {WALLET_SECURITY_TIPS.map((tip, index) => (
              <li key={index} className="mb-1">{tip}</li>
            ))}
          </ul>
        </div>

        {/* Confirmation Checkbox */}
        <Form.Check
          type="checkbox"
          id="confirm-saved"
          label="I have saved my secret key in a secure location"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mb-3"
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!confirmed}
        >
          I Have Saved My Secret Key
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SecretKeyModal;
