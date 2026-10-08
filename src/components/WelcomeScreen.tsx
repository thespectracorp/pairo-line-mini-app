import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

const heroImage = 'https://images.pexels.com/photos/34414715/pexels-photo-34414715.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <header className="welcome-header">
        <span className="brand">PAIRO</span>
      </header>
      <main className="welcome-main">
        <h1 className="welcome-title">Upload and match your clothing</h1>
        <p className="welcome-copy">Upload your clothing items and let the app suggest outfits for you.</p>
        <div className="welcome-image-frame">
          <ImageWithFallback src={heroImage} alt="Fashionable woman in a casual outfit" className="welcome-image" />
        </div>
      </main>
      <Button onClick={onGetStarted} className="pink-button welcome-button">Get Started</Button>
    </div>
  );
}
