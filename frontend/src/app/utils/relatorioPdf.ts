import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Tipos (espelham a resposta de GET /api/admin/relatorio) ──────────────────
export interface RelatorioAdmin {
  periodo: { inicio: string; fim: string }
  geradoEm: string
  resumoPeriodo: {
    novos_utilizadores: number
    novos_conteudos: number
    novos_topicos: number
    novas_respostas_forum: number
    tentativas_quiz: number
    quizzes_criados: number
    utilizadores_ativos: number
  }
  totaisGerais: {
    total_utilizadores: number
    total_admins: number
    total_conteudos: number
    total_quizzes: number
    total_topicos: number
  }
  conteudosPorTipo: { tipo: string; quantidade: number }[]
  topConteudos: {
    titulo: string
    tipo: string
    categoria: string | null
    visualizacoes: number
    likes: number
    comentarios: number
  }[]
  utilizadoresMaisAtivos: {
    nome: string
    email: string
    provincia: string | null
    quizzes_feitos: number
    respostas_forum: number
    conteudos_lidos: number
  }[]
  topicosPopulares: {
    titulo: string
    categoria: string | null
    votos: number
    respostas: number
    visualizacoes: number
    autor_nome: string
  }[]
}

const CORES = {
  primaria: [128, 0, 32] as [number, number, number], // #800020
  primariaEscura: [92, 0, 22] as [number, number, number], // #5C0016
  cinzaTexto: [51, 65, 85] as [number, number, number], // slate-700
  cinzaClaro: [241, 245, 249] as [number, number, number], // slate-100
}

const TIPO_LABEL: Record<string, string> = {
  video: 'Vídeo',
  texto_normal: 'Texto',
  texto_jindungo: 'Jindungo',
  podcast: 'Podcast',
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function truncar(texto: string, max: number): string {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto
}

/**
 * Gera e descarrega o relatório em PDF com base nos dados devolvidos por
 * GET /api/admin/relatorio. `labelPeriodo` é o texto do preset escolhido
 * (ex: "Hoje", "Esta semana", "Intervalo personalizado").
 */
export function gerarRelatorioPdf(relatorio: RelatorioAdmin, labelPeriodo: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const larguraPagina = doc.internal.pageSize.getWidth()
  const margem = 40

  // ── Cabeçalho ────────────────────────────────────────────────────────────
  doc.setFillColor(...CORES.primaria)
  doc.rect(0, 0, larguraPagina, 84, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Economia com História', margem, 34)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Relatório do Sistema — Painel de Administração', margem, 52)
  doc.setFontSize(9)
  doc.text(
    `Período: ${labelPeriodo}  (${formatarData(relatorio.periodo.inicio)} a ${formatarData(relatorio.periodo.fim)})`,
    margem,
    70,
  )

  let y = 108

  const tituloSeccao = (texto: string) => {
    doc.setTextColor(...CORES.primariaEscura)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(texto, margem, y)
    y += 8
  }

  // ── Resumo do período ──────────────────────────────────────────────────────
  tituloSeccao('Resumo do Período Selecionado')
  autoTable(doc, {
    startY: y,
    margin: { left: margem, right: margem },
    head: [['Indicador', 'Valor no período']],
    body: [
      ['Novos utilizadores registados', relatorio.resumoPeriodo.novos_utilizadores],
      ['Utilizadores ativos (leram conteúdo)', relatorio.resumoPeriodo.utilizadores_ativos],
      ['Novos conteúdos publicados', relatorio.resumoPeriodo.novos_conteudos],
      ['Novos tópicos no fórum', relatorio.resumoPeriodo.novos_topicos],
      ['Novas respostas no fórum', relatorio.resumoPeriodo.novas_respostas_forum],
      ['Tentativas de quiz realizadas', relatorio.resumoPeriodo.tentativas_quiz],
      ['Novos quizzes criados', relatorio.resumoPeriodo.quizzes_criados],
    ],
    headStyles: { fillColor: CORES.primaria, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: CORES.cinzaClaro },
    styles: { fontSize: 9, textColor: CORES.cinzaTexto, cellPadding: 6 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  })
  y = (doc as any).lastAutoTable.finalY + 26

  // ── Totais gerais da plataforma ─────────────────────────────────────────
  tituloSeccao('Totais Gerais da Plataforma (histórico completo)')
  autoTable(doc, {
    startY: y,
    margin: { left: margem, right: margem },
    head: [['Indicador', 'Total']],
    body: [
      ['Utilizadores ativos', relatorio.totaisGerais.total_utilizadores],
      ['Administradores', relatorio.totaisGerais.total_admins],
      ['Conteúdos na biblioteca', relatorio.totaisGerais.total_conteudos],
      ['Quizzes ativos', relatorio.totaisGerais.total_quizzes],
      ['Tópicos no fórum', relatorio.totaisGerais.total_topicos],
    ],
    headStyles: { fillColor: CORES.primaria, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: CORES.cinzaClaro },
    styles: { fontSize: 9, textColor: CORES.cinzaTexto, cellPadding: 6 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  })
  y = (doc as any).lastAutoTable.finalY + 26

  // ── Conteúdos publicados por tipo (no período) ──────────────────────────
  if (relatorio.conteudosPorTipo.length > 0) {
    tituloSeccao('Conteúdos Publicados por Tipo (no período)')
    autoTable(doc, {
      startY: y,
      margin: { left: margem, right: margem },
      head: [['Tipo de conteúdo', 'Quantidade publicada']],
      body: relatorio.conteudosPorTipo.map((c) => [TIPO_LABEL[c.tipo] ?? c.tipo, c.quantidade]),
      headStyles: { fillColor: CORES.primaria, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: CORES.cinzaClaro },
      styles: { fontSize: 9, textColor: CORES.cinzaTexto, cellPadding: 6 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    })
    y = (doc as any).lastAutoTable.finalY + 26
  }

  // ── Top conteúdos (no período) ──────────────────────────────────────────
  if (relatorio.topConteudos.length > 0) {
    tituloSeccao('Top 10 Conteúdos Mais Vistos (publicados no período)')
    autoTable(doc, {
      startY: y,
      margin: { left: margem, right: margem },
      head: [['Título', 'Tipo', 'Visualizações', 'Gostos', 'Comentários']],
      body: relatorio.topConteudos.map((c) => [
        truncar(c.titulo, 45),
        TIPO_LABEL[c.tipo] ?? c.tipo,
        c.visualizacoes,
        c.likes,
        c.comentarios,
      ]),
      headStyles: { fillColor: CORES.primaria, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: CORES.cinzaClaro },
      styles: { fontSize: 9, textColor: CORES.cinzaTexto, cellPadding: 6 },
      columnStyles: {
        2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
      },
    })
    y = (doc as any).lastAutoTable.finalY + 26
  }

  // ── Utilizadores mais ativos (no período) ───────────────────────────────
  if (relatorio.utilizadoresMaisAtivos.length > 0) {
    if (y > 650) { doc.addPage(); y = 50 }
    tituloSeccao('Utilizadores Mais Ativos (no período)')
    autoTable(doc, {
      startY: y,
      margin: { left: margem, right: margem },
      head: [['Nome', 'Província', 'Quizzes', 'Respostas fórum', 'Conteúdos lidos']],
      body: relatorio.utilizadoresMaisAtivos.map((u) => [
        truncar(u.nome, 30),
        u.provincia ?? '—',
        u.quizzes_feitos,
        u.respostas_forum,
        u.conteudos_lidos,
      ]),
      headStyles: { fillColor: CORES.primaria, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: CORES.cinzaClaro },
      styles: { fontSize: 9, textColor: CORES.cinzaTexto, cellPadding: 6 },
      columnStyles: {
        2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
      },
    })
    y = (doc as any).lastAutoTable.finalY + 26
  }

  // ── Tópicos mais populares (no período) ─────────────────────────────────
  if (relatorio.topicosPopulares.length > 0) {
    if (y > 650) { doc.addPage(); y = 50 }
    tituloSeccao('Tópicos do Fórum Mais Populares (criados no período)')
    autoTable(doc, {
      startY: y,
      margin: { left: margem, right: margem },
      head: [['Título', 'Autor', 'Votos', 'Respostas', 'Visualizações']],
      body: relatorio.topicosPopulares.map((t) => [
        truncar(t.titulo, 40),
        truncar(t.autor_nome, 22),
        t.votos,
        t.respostas,
        t.visualizacoes,
      ]),
      headStyles: { fillColor: CORES.primaria, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: CORES.cinzaClaro },
      styles: { fontSize: 9, textColor: CORES.cinzaTexto, cellPadding: 6 },
      columnStyles: {
        2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
      },
    })
  }

  // ── Rodapé: nº de página + data de geração, em todas as páginas ────────
  const totalPaginas = doc.getNumberOfPages()
  const geradoEm = new Date(relatorio.geradoEm).toLocaleString('pt-PT')
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    const alturaPagina = doc.internal.pageSize.getHeight()
    doc.setDrawColor(...CORES.cinzaClaro)
    doc.line(margem, alturaPagina - 36, larguraPagina - margem, alturaPagina - 36)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184) // slate-400
    doc.text(`Gerado em ${geradoEm}`, margem, alturaPagina - 22)
    doc.text(`Página ${i} de ${totalPaginas}`, larguraPagina - margem, alturaPagina - 22, { align: 'right' })
  }

  const nomeFicheiro = `relatorio-economia-historia_${relatorio.periodo.inicio}_a_${relatorio.periodo.fim}.pdf`
  doc.save(nomeFicheiro)
}
