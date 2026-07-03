import { Link } from 'react-router'
import { BookOpen } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5C0016]">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">Economia com História</span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-slate-400">
              Plataforma educativa para integração de conteúdos históricos e económicos de Angola.
            </p>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Siga-nos</h4>
              <div className="flex gap-3">
                <a href="#" className="text-slate-400 transition-colors hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 transition-colors hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.337-5.573c2.9-5.365 1.565-12.647-2.63-16.546z" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 transition-colors hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.919-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Navegação</h4>
            <ul className="space-y-2">
              {[
                { label: 'Início', href: '/' },
                { label: 'Explorar', href: '/explorar' },
                { label: 'Quizes', href: '/resources' },
                { label: 'Fórum', href: '/forum' },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Contate-nos</h4>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs text-slate-400">Telefone:</p>
                <p className="text-sm text-white">+244 938 520 669</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-400">Email:</p>
                <p className="text-sm text-white">carlos.lopes@isptec.co.ao</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <div className="mb-3 flex flex-wrap justify-center gap-4 md:gap-6">
            <a href="#" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
              Política de Privacidade
            </a>
            <a href="#" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
              Nossa História
            </a>
            <a href="#" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
              O Que Fazemos
            </a>
          </div>
          <p className="text-center text-xs text-slate-500">
            © 2023 Economia com História - Angola. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
