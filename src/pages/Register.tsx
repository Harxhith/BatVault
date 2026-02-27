
import { AuthForm } from "@/components/AuthForm";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-batman bat-grad-bg">
      <AuthForm isLogin={false} />
    </div>
  );
};

export default Register;
