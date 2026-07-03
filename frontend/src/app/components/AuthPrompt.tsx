import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useNavigate } from 'react-router';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: string;
}

export default function AuthPrompt({ open, onOpenChange, action = 'realizar esta ação' }: AuthPromptProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/login');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-[#800020] via-black to-yellow-500 rounded-lg flex items-center justify-center">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            Autenticação Necessária
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base pt-2">
            Para {action}, você precisa estar autenticado na plataforma.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <div className="bg-gradient-to-r from-[#FFF2F2] to-yellow-50 border border-[#FDD5D5] rounded-lg p-4">
            <h4 className="font-semibold text-sm text-slate-900 mb-2">Benefícios de ter uma conta:</h4>
            <ul className="space-y-1 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <span className="text-[#800020]">✓</span>
                Participar de quizzes e ganhar pontos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#800020]">✓</span>
                Competir no ranking nacional e provincial
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#800020]">✓</span>
                Criar e comentar em debates
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#800020]">✓</span>
                Acompanhar seu progresso de aprendizagem
              </li>
            </ul>
          </div>
        </div>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel>Continuar Navegando</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogin}
            className="bg-gradient-to-r from-[#800020] to-yellow-600 hover:from-[#5C0016] hover:to-yellow-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Entrar ou Cadastrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
