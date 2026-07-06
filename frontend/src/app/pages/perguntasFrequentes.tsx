import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function PerguntasFrequentes() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Como faço para me cadastrar?',
      answer: 'Clique em "Criar conta" no canto superior direito. Preencha seu nome, email e telemóvel. O cadastro é gratuito e instantâneo.'
    },
    {
      question: 'O que são "Textos com Jindungo"?',
      answer: 'São conteúdos exclusivos que exigem aprovação do administrador. Solicite acesso e expanda seu conhecimento.'
    },
    {
      question: 'Como ganho pontos no ranking?',
      answer: 'Participe dos quizzes, comente no fórum e interaja com os conteúdos. Cada atividade certa acumula pontos.'
    },
    {
      question: 'Posso sugerir novos temas?',
      answer: 'Sim! No fórum existe a opção "Sugerir Temas". A equipa analisa todas as sugestões enviadas pela comunidade.'
    },
    {
      question: 'Os conteúdos são gratuitos?',
      answer: 'Sim, a maioria dos conteúdos é gratuita. Apenas os "Textos com Jindungo" exigem solicitação de acesso.'
    },
    {
      question: 'Como entro em contato?',
      answer: 'Use o email suporte@economiacomhistoria.ao ou o telefone +244 923 456 789. Respondemos em até 24h.'
    },
    {
      question: 'Qual é o propósito desta plataforma?',
      answer: 'Nosso objetivo é promover o conhecimento sobre a história económica de Angola, proporcionando recursos educativos acessíveis para todos os angolanos.'
    },
    {
      question: 'Como funcionam os quizzes?',
      answer: 'Os quizzes são testes interativos sobre diversos temas. Complete-os para ganhar pontos e subir no ranking. Cada quiz tem tempo limitado e perguntas de múltipla escolha.'
    },
    {
      question: 'Posso acessar a plataforma pelo telemóvel?',
      answer: 'Sim! A plataforma está otimizada para funcionar perfeitamente em telemóveis, tablets e computadores.'
    },
    {
      question: 'Como participo nos debates?',
      answer: 'Acesse a secção "Espaço de Debate", escolha um tópico que lhe interesse e comece a participar nas discussões. Você pode criar novos tópicos ou comentar em existentes.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <section className="text-white py-24 px-6" style={{ background: '#800020' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Perguntas Frequentes</h1>
          <p className="text-xl opacity-90">
            Encontre respostas para as perguntas mais comuns sobre a plataforma
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-lg text-slate-900 pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-600 flex-shrink-0 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6 bg-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">Não encontrou a resposta?</h2>
          <p className="text-lg text-slate-700 mb-6">
            Entre em contacto connosco e teremos prazer em ajudá-lo
          </p>
          <button
            className="px-8 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg"
            style={{ background: '#800020' }}
          >
            Contactar Suporte
          </button>
        </div>
      </section>
    </div>
  );
}
