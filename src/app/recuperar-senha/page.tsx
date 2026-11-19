import { PedirRecuperacao } from "@/components/FormRecuperacao";

export default function RecuperarSenha() {
  return (
    <div className="space-y-6">
      <header className="mx-auto max-w-md space-y-2">
        <h1 className="text-3xl font-bold">Esqueci minha senha</h1>
        <p className="text-tinta-suave">Informe o e-mail da conta. Vamos enviar um link para você criar uma nova senha.</p>
      </header>
      <PedirRecuperacao />
    </div>
  );
}
