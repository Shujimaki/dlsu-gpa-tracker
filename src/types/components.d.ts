declare module './components/Header' {
  import type { User } from './types';
  
  interface HeaderProps {
    user: User | null;
    onLoginClick: () => void;
    onLogout: () => void;
  }
  
  const Header: React.FC<HeaderProps>;
  export default Header;
}

declare module './components/GPACalculator' {
  import type { User } from './types';
  
  interface GPACalculatorProps {
    user: User | null;
  }
  
  const GPACalculator: React.FC<GPACalculatorProps>;
  export default GPACalculator;
}

declare module './components/LoginModal' {
  import type { User } from './types';
  
  interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (user: User) => void;
  }
  
  const LoginModal: React.FC<LoginModalProps>;
  export default LoginModal;
} 