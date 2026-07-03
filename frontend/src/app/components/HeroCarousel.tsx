import { Link } from 'react-router'
import { ArrowRight, MapPin } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import videoSrc from '../../imports/8199516-hd_1920_1080_25fps.mp4'

export default function HeroCarousel() {
  const { isAuthenticated } = useAuth()

  return (
    <section className="relative flex min-h-[520px] items-center overflow-hidden md:min-h-[580px]">
      <div className="absolute inset-0">
        <video autoPlay loop muted playsInline className="h-full w-full object-cover">
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 w-full py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-500 px-4 py-1.5 text-sm font-medium text-yellow-400">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              Plataforma para todos os angolanos
            </div>

            <h1 className="mb-4 text-3xl font-playfair font-bold leading-tight text-white md:text-4xl">
              Bem-vindo à plataforma
            </h1>

            <div className="mb-4 h-px w-64 bg-white/30" />

            <p className="mb-8 max-w-lg text-xs leading-relaxed text-white/80 md:text-sm">
              Explore Conteúdos Educativos sobre Economia e História de Angola. Participe de Fóruns de Fiscussões, teste seus conhecimentos com o nosso Quiz e faça parte da construção colectiva do saber angolano.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/explorar"
                className="inline-flex items-center gap-2 rounded-lg bg-[#5C0016] px-6 py-3 font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-[#5C0016]"
              >
                Ver Conteúdos
                <ArrowRight className="h-4 w-4 transition-transform" />
              </Link>

              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/20"
                >
                  Criar conta gratuita
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
