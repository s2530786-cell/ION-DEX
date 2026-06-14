import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const languages = [
  {
    key: "en",
    label: "English",
    readmeFile: "README.md",
    docsDir: null,
    whitepaperDir: null,
    whitepaperFile: "docs/WHITEPAPER.md",
  },
  {
    key: "zh-CN",
    label: "简体中文",
    readmeFile: "README.zh-CN.md",
    docsDir: "zh-CN",
    whitepaperDir: "zh",
    whitepaperFile: "docs/whitepaper/zh/WHITEPAPER.zh-CN.md",
    copy: {
      title: "ION — 超数字文明的操作系统",
      intro:
        "这是 ION DEX 的简体中文公开总览页。它把 README、文档中心、白皮书索引和白皮书概览串成同语言阅读路径，让语言切换不再停留在假入口层。",
      briefHeading: "ION DEX 简介",
      bullets: [
        "以 28 链 DEX 与聚合交易入口为起点的长期基础设施。",
        "面向用户、商户与平台的低摩擦多链支付能力。",
        "统一的身份、证明、信誉与可验证历史层。",
        "围绕 AI Sentinel、防御、仲裁与协同的长期架构。",
        "以 burn、staking 与 treasury 为核心的长期价值飞轮。",
      ],
      statusHeading: "当前公开状态",
      status:
        "当前公开仓库可验证的重点包括：README / docs / whitepaper 公共材料、UI 基础、typed backend/data routes、verification tooling，以及合约 scaffolding。许多模块仍属于 roadmap 或 draft design 阶段。",
      startHeading: "从这里开始",
      nextHeading: "下一步阅读",
      docsHubTitle: "ION DEX 中文文档中心",
      docsHubIntro:
        "这里是 ION DEX 的简体中文文档入口，用于衔接中文 README、中文白皮书概览，以及仍以英文为规范源的公开技术材料。",
      whitepaperIndexTitle: "ION DEX 中文白皮书索引",
      whitepaperIndexIntro:
        "这里是 ION DEX 白皮书的中文阅读入口，帮助你快速理解长期愿景、核心模块以及后续阅读路径。",
      whitepaperTitle: "ION DEX 白皮书（简体中文概览版）",
      whitepaperIntro:
        "ION DEX 被描述为一套长期基础设施：从 28 链 DEX 出发，逐步延伸到支付、身份、证明、仲裁、协同与 AI Sentinel defense。",
      whitepaperCoversHeading: "这份白皮书概览覆盖什么",
      whitepaperBullets: [
        "DEX、liquidity、routing 与 settlement 的长期定位。",
        "向 payments、merchants 与 cross-border e-commerce 的扩展方向。",
        "identity、proof、reputation 与 civil layer 的设计。",
        "AI arbitration、Sentinel defense 与 governance 的边界。",
        "burn、staking、treasury 与 roadmap 的框架。",
      ],
      boundaryHeading: "当前边界",
      boundary:
        "英文白皮书仍然是 final wording、economics、security boundaries 与 release status 的 canonical source。若不同语言版本之间存在歧义，以英文原文和已发布的 audited on-chain / contract materials 为准。",
      continueHeading: "继续阅读",
      docsHubLabel: "中文文档中心",
      whitepaperOverviewLabel: "中文白皮书概览",
      whitepaperIndexLabel: "中文白皮书索引",
      explorerLabel: "Explorer",
      localReadmeLabel: "本语言 README",
      englishWhitepaperLabel: "英文完整白皮书",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "说明：这条中文路径提供稳定的公开阅读入口；涉及最终措辞、经济参数、安全边界与发布状态时，仍以英文公共文档为准。",
    },
  },
  {
    key: "zh-TW",
    label: "繁體中文",
    readmeFile: "README.zh-TW.md",
    docsDir: "zh-TW",
    whitepaperDir: "zh-TW",
    whitepaperFile: "docs/whitepaper/zh-TW/WHITEPAPER.zh-TW.md",
    copy: {
      title: "ION — 超級數位文明的作業系統",
      intro:
        "這是 ION DEX 的繁體中文公開導覽頁，讓讀者可以用同一語言進入專案概覽、文件入口與白皮書總覽。",
      briefHeading: "ION DEX 簡介",
      bullets: [
        "28 鏈去中心化交易所與聚合交易入口。",
        "面向商戶、平台與用戶的低摩擦多鏈支付基礎設施。",
        "官方身份、證明、聲譽與可驗證歷史的持續層。",
        "AI Sentinel、防禦、仲裁與協調能力的長期架構。",
        "以手續費銷毀、質押與國庫為核心的長期價值飛輪。",
      ],
      statusHeading: "目前公開狀態",
      status:
        "公開倉庫目前可驗證的是：README / 文件 / 白皮書公開材料、UI 基礎、型別化 backend/data 路由、驗證工具鏈與合約腳手架。許多模組仍屬於路線圖或草案設計。",
      startHeading: "從這裡開始",
      nextHeading: "下一步閱讀",
      docsHubTitle: "ION DEX 文件中心",
      docsHubIntro:
        "此頁是 ION DEX 的繁體中文文件入口，用來連接本語言 README、白皮書導覽與英文規範文件。",
      whitepaperIndexTitle: "ION DEX 白皮書索引",
      whitepaperIndexIntro:
        "此頁是繁體中文白皮書導覽頁，用來快速理解 ION DEX 的長期願景、核心模組與閱讀路線。",
      whitepaperTitle: "ION DEX 白皮書（繁體中文導覽版）",
      whitepaperIntro:
        "ION DEX 被描述為一套長期基礎設施：以 28 鏈 DEX 為起點，延展到支付、身份、證明、仲裁、協調與 AI Sentinel 防禦。",
      whitepaperCoversHeading: "這份白皮書涵蓋什麼",
      whitepaperBullets: [
        "DEX、流動性、路由與結算的長期定位。",
        "支付、商戶與跨境電商的擴張方向。",
        "身份、證明、聲譽與文明層設計。",
        "AI 仲裁、Sentinel 防禦與治理邊界。",
        "銷毀、質押、國庫與路線圖框架。",
      ],
      boundaryHeading: "目前邊界",
      boundary:
        "英文白皮書仍然是最終規範來源，特別是經濟模型、安全邊界、發布狀態與最終措辭。如不同語言版本之間存在歧義，以英文原文與已審計、已發布的鏈上 / 合約資料為準。",
      continueHeading: "繼續閱讀",
      docsHubLabel: "文件中心",
      whitepaperOverviewLabel: "白皮書導覽",
      whitepaperIndexLabel: "白皮書索引",
      explorerLabel: "瀏覽器",
      localReadmeLabel: "本語言 README",
      englishWhitepaperLabel: "英文完整白皮書",
      englishDeveloperLabel: "英文 Developer Index",
      canonicalNote:
        "說明：本語言頁面提供穩定的公開閱讀入口；英文公開文件仍是最終規範來源。",
    },
  },
  {
    key: "ru",
    label: "Русский",
    readmeFile: "README.ru.md",
    docsDir: "ru",
    whitepaperDir: "ru",
    whitepaperFile: "docs/whitepaper/ru/WHITEPAPER.ru.md",
    copy: {
      title: "ION — Операционная система для сверхцифровой цивилизации",
      intro:
        "Это русскоязычная публичная обзорная страница ION DEX, которая дает единый вход на одном языке к проекту, документации и обзору whitepaper.",
      briefHeading: "Кратко об ION DEX",
      bullets: [
        "28-chain DEX и агрегированный вход в торговую инфраструктуру.",
        "Низкофрикционные мультичейн-платежи для пользователей, продавцов и платформ.",
        "Единый слой идентичности, доказательств, репутации и проверяемой истории.",
        "Долгосрочная архитектура AI Sentinel, защиты, арбитража и координации.",
        "Долгосрочный value flywheel вокруг burn, staking и treasury.",
      ],
      statusHeading: "Текущий публичный статус",
      status:
        "В открытом репозитории сейчас проверяемы: публичные README / docs / whitepaper-материалы, UI foundations, typed backend/data routes, verification tooling и contract scaffolding. Многие модули пока остаются roadmap или draft design.",
      startHeading: "Начните здесь",
      nextHeading: "Что читать дальше",
      docsHubTitle: "Центр документации ION DEX",
      docsHubIntro:
        "Эта страница служит русскоязычным входом в документацию ION DEX и связывает локальный README, обзор whitepaper и канонические английские технические документы.",
      whitepaperIndexTitle: "Индекс whitepaper ION DEX",
      whitepaperIndexIntro:
        "Эта страница — русскоязычный маршрут чтения whitepaper, чтобы быстро понять долгосрочное видение, ключевые модули и порядок чтения.",
      whitepaperTitle: "Whitepaper ION DEX (русскоязычная обзорная версия)",
      whitepaperIntro:
        "ION DEX описывается как долгосрочная инфраструктура: старт от 28-chain DEX с расширением в платежи, идентичность, доказательства, арбитраж, координацию и AI Sentinel defense.",
      whitepaperCoversHeading: "Что покрывает этот whitepaper",
      whitepaperBullets: [
        "Долгосрочную роль DEX, liquidity, routing и settlement.",
        "Направление расширения в payments, merchants и cross-border e-commerce.",
        "Identity, proof, reputation и civil layer design.",
        "AI arbitration, Sentinel defense и governance boundaries.",
        "Burn, staking, treasury и roadmap framework.",
      ],
      boundaryHeading: "Текущая граница",
      boundary:
        "Английский whitepaper остается каноническим источником для финальных формулировок, economics, security boundaries и release status. Если между языковыми версиями возникает неоднозначность, приоритет имеют английский текст и опубликованные audited on-chain / contract материалы.",
      continueHeading: "Продолжить чтение",
      docsHubLabel: "Центр документации",
      whitepaperOverviewLabel: "Обзор whitepaper",
      whitepaperIndexLabel: "Индекс whitepaper",
      explorerLabel: "Explorer",
      localReadmeLabel: "README на этом языке",
      englishWhitepaperLabel: "Полный whitepaper на английском",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "Примечание: эта языковая ветка дает стабильный публичный вход для чтения; английские публичные документы остаются финальным каноническим источником.",
    },
  },
  {
    key: "es",
    label: "Español",
    readmeFile: "README.es.md",
    docsDir: "es",
    whitepaperDir: "es",
    whitepaperFile: "docs/whitepaper/es/WHITEPAPER.es.md",
    copy: {
      title: "ION — El sistema operativo para una supercivilización digital",
      intro:
        "Esta es la página pública de visión general en español de ION DEX. Ofrece una entrada continua en el mismo idioma hacia el proyecto, la documentación y el whitepaper.",
      briefHeading: "ION DEX en breve",
      bullets: [
        "Un DEX de 28 cadenas y una superficie agregada para trading e infraestructura.",
        "Pagos multicadena de baja fricción para usuarios, merchants y plataformas.",
        "Una capa unificada de identidad, proof, reputation e historia verificable.",
        "Una arquitectura de largo plazo para AI Sentinel, defensa, arbitraje y coordinación.",
        "Un flywheel de valor de largo plazo basado en fee burn, staking y treasury.",
      ],
      statusHeading: "Estado público actual",
      status:
        "El repositorio público hoy demuestra: materiales públicos de README / docs / whitepaper, foundations de UI, typed backend/data routes, verification tooling y contract scaffolding. Muchos módulos siguen siendo roadmap o draft design.",
      startHeading: "Empieza aquí",
      nextHeading: "Qué leer después",
      docsHubTitle: "Centro de documentación de ION DEX",
      docsHubIntro:
        "Esta página sirve como puerta de entrada en español a la documentación de ION DEX y conecta el README local, la guía del whitepaper y los documentos técnicos canónicos en inglés.",
      whitepaperIndexTitle: "Índice del whitepaper de ION DEX",
      whitepaperIndexIntro:
        "Esta página es la ruta de lectura en español del whitepaper para entender rápidamente la visión de largo plazo, los módulos principales y el orden de lectura.",
      whitepaperTitle: "Whitepaper de ION DEX (edición resumida en español)",
      whitepaperIntro:
        "ION DEX se presenta como una infraestructura de largo horizonte: empieza con un DEX de 28 cadenas y se expande hacia pagos, identidad, proof, arbitraje, coordinación y defensa AI Sentinel.",
      whitepaperCoversHeading: "Qué cubre este whitepaper",
      whitepaperBullets: [
        "El posicionamiento de largo plazo de DEX, liquidity, routing y settlement.",
        "La expansión hacia payments, merchants y cross-border e-commerce.",
        "El diseño de identity, proof, reputation y civil layer.",
        "Los límites de AI arbitration, Sentinel defense y governance.",
        "El marco de burn, staking, treasury y roadmap.",
      ],
      boundaryHeading: "Límite actual",
      boundary:
        "El whitepaper en inglés sigue siendo la fuente canónica para wording final, economics, security boundaries y release status. Si existe ambigüedad entre idiomas, prevalecen el texto en inglés y los materiales audited on-chain / contract ya publicados.",
      continueHeading: "Seguir leyendo",
      docsHubLabel: "Centro de documentación",
      whitepaperOverviewLabel: "Resumen del whitepaper",
      whitepaperIndexLabel: "Índice del whitepaper",
      explorerLabel: "Explorer",
      localReadmeLabel: "README en este idioma",
      englishWhitepaperLabel: "Whitepaper completo en inglés",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "Nota: esta ruta en el idioma ofrece una entrada pública estable para leer; los documentos públicos en inglés siguen siendo la fuente canónica final.",
    },
  },
  {
    key: "pt",
    label: "Português",
    readmeFile: "README.pt.md",
    docsDir: "pt",
    whitepaperDir: "pt",
    whitepaperFile: "docs/whitepaper/pt/WHITEPAPER.pt.md",
    copy: {
      title: "ION — O sistema operacional para uma supercivilização digital",
      intro:
        "Esta é a página pública de visão geral em português do ION DEX. Ela oferece uma entrada contínua no mesmo idioma para o projeto, a documentação e o whitepaper.",
      briefHeading: "ION DEX em resumo",
      bullets: [
        "Uma DEX de 28 cadeias e uma superfície agregada para trading e infraestrutura.",
        "Pagamentos multicadeia de baixa fricção para usuários, merchants e plataformas.",
        "Uma camada unificada de identidade, proof, reputation e histórico verificável.",
        "Uma arquitetura de longo prazo para AI Sentinel, defesa, arbitragem e coordenação.",
        "Um flywheel de valor de longo prazo baseado em fee burn, staking e treasury.",
      ],
      statusHeading: "Status público atual",
      status:
        "O repositório público hoje comprova: materiais públicos de README / docs / whitepaper, UI foundations, typed backend/data routes, verification tooling e contract scaffolding. Muitos módulos ainda permanecem em roadmap ou draft design.",
      startHeading: "Comece aqui",
      nextHeading: "Leitura seguinte",
      docsHubTitle: "Hub de documentação do ION DEX",
      docsHubIntro:
        "Esta página funciona como a porta de entrada em português para a documentação do ION DEX e conecta o README local, a visão geral do whitepaper e os documentos técnicos canônicos em inglês.",
      whitepaperIndexTitle: "Índice do whitepaper do ION DEX",
      whitepaperIndexIntro:
        "Esta página é a rota de leitura em português do whitepaper para entender rapidamente a visão de longo prazo, os módulos centrais e a ordem de leitura.",
      whitepaperTitle: "Whitepaper do ION DEX (edição resumida em português)",
      whitepaperIntro:
        "O ION DEX é descrito como uma infraestrutura de longo horizonte: começa com uma DEX de 28 cadeias e se expande para pagamentos, identidade, proof, arbitragem, coordenação e AI Sentinel defense.",
      whitepaperCoversHeading: "O que este whitepaper cobre",
      whitepaperBullets: [
        "O posicionamento de longo prazo de DEX, liquidity, routing e settlement.",
        "A expansão para payments, merchants e cross-border e-commerce.",
        "O desenho de identity, proof, reputation e civil layer.",
        "Os limites de AI arbitration, Sentinel defense e governance.",
        "O framework de burn, staking, treasury e roadmap.",
      ],
      boundaryHeading: "Limite atual",
      boundary:
        "O whitepaper em inglês continua sendo a fonte canônica para wording final, economics, security boundaries e release status. Se houver ambiguidade entre idiomas, prevalecem o texto em inglês e os materiais audited on-chain / contract já publicados.",
      continueHeading: "Continuar leitura",
      docsHubLabel: "Hub de documentação",
      whitepaperOverviewLabel: "Resumo do whitepaper",
      whitepaperIndexLabel: "Índice do whitepaper",
      explorerLabel: "Explorer",
      localReadmeLabel: "README neste idioma",
      englishWhitepaperLabel: "Whitepaper completo em inglês",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "Nota: esta trilha em português oferece uma entrada pública estável de leitura; os documentos públicos em inglês continuam sendo a fonte canônica final.",
    },
  },
  {
    key: "ar",
    label: "العربية",
    readmeFile: "README.ar.md",
    docsDir: "ar",
    whitepaperDir: "ar",
    whitepaperFile: "docs/whitepaper/ar/WHITEPAPER.ar.md",
    copy: {
      title: "ION — نظام التشغيل لحضارة رقمية فائقة",
      intro:
        "هذه صفحة النظرة العامة العامة باللغة العربية لـ ION DEX. وهي تمنح القارئ مدخلاً ثابتاً باللغة نفسها إلى المشروع والوثائق ونظرة whitepaper.",
      briefHeading: "ION DEX باختصار",
      bullets: [
        "DEX متعدد السلاسل عبر 28 شبكة مع طبقة تجميع للتداول والبنية التحتية.",
        "مدفوعات متعددة السلاسل منخفضة الاحتكاك للمستخدمين والتجار والمنصات.",
        "طبقة موحدة للهوية والإثبات والسمعة والتاريخ القابل للتحقق.",
        "بنية طويلة الأفق لـ AI Sentinel والدفاع والتحكيم والتنسيق.",
        "عجلة قيمة طويلة المدى مبنية على fee burn وstaking وtreasury.",
      ],
      statusHeading: "الحالة العامة الحالية",
      status:
        "المستودع العام يثبت حالياً: مواد README / docs / whitepaper العامة، وأسس UI، ومسارات backend/data typed، وأدوات verification، وcontract scaffolding. كثير من الوحدات ما تزال ضمن roadmap أو draft design.",
      startHeading: "ابدأ من هنا",
      nextHeading: "ماذا تقرأ بعد ذلك",
      docsHubTitle: "مركز وثائق ION DEX",
      docsHubIntro:
        "هذه الصفحة هي بوابة الوثائق العربية لـ ION DEX، وتربط README المحلي، ونظرة whitepaper، والوثائق التقنية الإنجليزية المعيارية.",
      whitepaperIndexTitle: "فهرس whitepaper لـ ION DEX",
      whitepaperIndexIntro:
        "هذه الصفحة هي مسار القراءة العربي للـ whitepaper لفهم الرؤية طويلة الأمد والوحدات الأساسية وترتيب القراءة بسرعة.",
      whitepaperTitle: "Whitepaper ION DEX (نسخة موجزة بالعربية)",
      whitepaperIntro:
        "يُعرض ION DEX كبنية تحتية طويلة الأفق: يبدأ من DEX عبر 28 سلسلة ثم يمتد إلى المدفوعات والهوية والإثبات والتحكيم والتنسيق ودفاع AI Sentinel.",
      whitepaperCoversHeading: "ما الذي تغطيه هذه الـ whitepaper",
      whitepaperBullets: [
        "الموقع طويل الأمد لـ DEX والسيولة والتوجيه والتسوية.",
        "التوسع نحو payments وmerchants وcross-border e-commerce.",
        "تصميم identity وproof وreputation وcivil layer.",
        "حدود AI arbitration وSentinel defense وgovernance.",
        "إطار burn وstaking وtreasury وroadmap.",
      ],
      boundaryHeading: "الحد الحالي",
      boundary:
        "تبقى الـ whitepaper الإنجليزية هي المصدر المعياري النهائي للصياغة والاقتصاديات والحدود الأمنية وحالة الإصدار. وعند وجود غموض بين اللغات، تكون الأولوية للنص الإنجليزي وللمواد audited on-chain / contract المنشورة.",
      continueHeading: "تابع القراءة",
      docsHubLabel: "مركز الوثائق",
      whitepaperOverviewLabel: "نظرة whitepaper",
      whitepaperIndexLabel: "فهرس whitepaper",
      explorerLabel: "Explorer",
      localReadmeLabel: "README بهذه اللغة",
      englishWhitepaperLabel: "الـ whitepaper الكاملة بالإنجليزية",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "ملاحظة: هذه السلسلة اللغوية توفّر مدخلاً عاماً ثابتاً للقراءة، بينما تبقى الوثائق العامة الإنجليزية هي المصدر المعياري النهائي.",
    },
  },
  {
    key: "fr",
    label: "Français",
    readmeFile: "README.fr.md",
    docsDir: "fr",
    whitepaperDir: "fr",
    whitepaperFile: "docs/whitepaper/fr/WHITEPAPER.fr.md",
    copy: {
      title: "ION — Le système d’exploitation d’une super civilisation numérique",
      intro:
        "Voici la page publique d’ensemble en français pour ION DEX. Elle fournit une entrée continue dans la même langue vers le projet, la documentation et l’aperçu du whitepaper.",
      briefHeading: "ION DEX en bref",
      bullets: [
        "Un DEX 28 chaînes et une surface agrégée de trading et d’infrastructure.",
        "Des paiements multi-chaînes à faible friction pour les utilisateurs, merchants et plateformes.",
        "Une couche unifiée d’identité, de proof, de reputation et d’historique vérifiable.",
        "Une architecture long terme pour AI Sentinel, la défense, l’arbitrage et la coordination.",
        "Un flywheel de valeur long terme centré sur fee burn, staking et treasury.",
      ],
      statusHeading: "Statut public actuel",
      status:
        "Le dépôt public prouve aujourd’hui : les matériaux publics README / docs / whitepaper, les foundations UI, les typed backend/data routes, les outils de verification et le contract scaffolding. Beaucoup de modules restent encore au stade roadmap ou draft design.",
      startHeading: "Commencer ici",
      nextHeading: "Lecture suivante",
      docsHubTitle: "Centre de documentation ION DEX",
      docsHubIntro:
        "Cette page sert de porte d’entrée française à la documentation ION DEX et relie le README local, l’aperçu du whitepaper et les documents techniques canoniques en anglais.",
      whitepaperIndexTitle: "Index du whitepaper ION DEX",
      whitepaperIndexIntro:
        "Cette page est le parcours de lecture français du whitepaper pour comprendre rapidement la vision de long terme, les modules clés et l’ordre de lecture.",
      whitepaperTitle: "Whitepaper ION DEX (édition de synthèse en français)",
      whitepaperIntro:
        "ION DEX est présenté comme une infrastructure long-horizon : il commence par un DEX 28 chaînes puis s’étend vers les paiements, l’identité, la proof, l’arbitrage, la coordination et la défense AI Sentinel.",
      whitepaperCoversHeading: "Ce que couvre ce whitepaper",
      whitepaperBullets: [
        "Le positionnement long terme du DEX, de la liquidity, du routing et du settlement.",
        "L’extension vers payments, merchants et cross-border e-commerce.",
        "Le design de identity, proof, reputation et civil layer.",
        "Les limites de AI arbitration, Sentinel defense et governance.",
        "Le cadre burn, staking, treasury et roadmap.",
      ],
      boundaryHeading: "Limite actuelle",
      boundary:
        "Le whitepaper anglais reste la source canonique pour la formulation finale, les economics, les security boundaries et le release status. En cas d’ambiguïté entre langues, le texte anglais et les matériaux audited on-chain / contract publiés prévalent.",
      continueHeading: "Continuer la lecture",
      docsHubLabel: "Centre de documentation",
      whitepaperOverviewLabel: "Aperçu du whitepaper",
      whitepaperIndexLabel: "Index du whitepaper",
      explorerLabel: "Explorer",
      localReadmeLabel: "README dans cette langue",
      englishWhitepaperLabel: "Whitepaper complète en anglais",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "Note : cette branche linguistique offre une entrée publique stable de lecture ; les documents publics anglais restent la source canonique finale.",
    },
  },
  {
    key: "de",
    label: "Deutsch",
    readmeFile: "README.de.md",
    docsDir: "de",
    whitepaperDir: "de",
    whitepaperFile: "docs/whitepaper/de/WHITEPAPER.de.md",
    copy: {
      title: "ION — Das Betriebssystem für eine superdigitale Zivilisation",
      intro:
        "Dies ist die öffentliche deutschsprachige Übersichtsseite von ION DEX. Sie bietet einen durchgehenden Einstieg in derselben Sprache zu Projekt, Dokumentation und Whitepaper-Überblick.",
      briefHeading: "ION DEX im Überblick",
      bullets: [
        "Eine 28-Chain-DEX und eine aggregierte Oberfläche für Trading und Infrastruktur.",
        "Reibungsarme Multi-Chain-Zahlungen für Nutzer, Merchants und Plattformen.",
        "Eine einheitliche Ebene für Identität, Proof, Reputation und verifizierbare Historie.",
        "Eine Langfrist-Architektur für AI Sentinel, Defense, Arbitration und Coordination.",
        "Ein langfristiges Value-Flywheel rund um Fee Burn, Staking und Treasury.",
      ],
      statusHeading: "Aktueller öffentlicher Status",
      status:
        "Das öffentliche Repository belegt derzeit: öffentliche README / Docs / Whitepaper-Materialien, UI foundations, typed backend/data routes, verification tooling und contract scaffolding. Viele Module bleiben noch roadmap oder draft design.",
      startHeading: "Hier starten",
      nextHeading: "Weiterlesen",
      docsHubTitle: "ION DEX Dokumentationszentrum",
      docsHubIntro:
        "Diese Seite ist der deutschsprachige Einstieg in die ION-Dokumentation und verbindet das lokale README, den Whitepaper-Überblick und die kanonischen englischen technischen Dokumente.",
      whitepaperIndexTitle: "ION DEX Whitepaper-Index",
      whitepaperIndexIntro:
        "Diese Seite ist die deutschsprachige Whitepaper-Lesestrecke, um die Langfristvision, die Kernmodule und die empfohlene Lesereihenfolge schnell zu verstehen.",
      whitepaperTitle: "ION DEX Whitepaper (deutsche Überblicksausgabe)",
      whitepaperIntro:
        "ION DEX wird als Long-Horizon-Infrastruktur beschrieben: Beginnend mit einer 28-Chain-DEX erweitert es sich in Payments, Identity, Proof, Arbitration, Coordination und AI Sentinel Defense.",
      whitepaperCoversHeading: "Was dieses Whitepaper abdeckt",
      whitepaperBullets: [
        "Die langfristige Rolle von DEX, Liquidity, Routing und Settlement.",
        "Die Erweiterung in Payments, Merchants und Cross-Border E-Commerce.",
        "Das Design von Identity, Proof, Reputation und Civil Layer.",
        "Die Grenzen von AI Arbitration, Sentinel Defense und Governance.",
        "Das Framework für Burn, Staking, Treasury und Roadmap.",
      ],
      boundaryHeading: "Aktuelle Grenze",
      boundary:
        "Das englische Whitepaper bleibt die kanonische Quelle für finale Formulierungen, Economics, Security Boundaries und Release Status. Bei Mehrdeutigkeiten zwischen Sprachversionen gelten der englische Text und die veröffentlichten audited on-chain / contract Materialien.",
      continueHeading: "Weiterlesen",
      docsHubLabel: "Dokumentationszentrum",
      whitepaperOverviewLabel: "Whitepaper-Überblick",
      whitepaperIndexLabel: "Whitepaper-Index",
      explorerLabel: "Explorer",
      localReadmeLabel: "README in dieser Sprache",
      englishWhitepaperLabel: "Vollständiges englisches Whitepaper",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "Hinweis: Dieser Sprachpfad bietet einen stabilen öffentlichen Leseeinstieg; die englischen öffentlichen Dokumente bleiben die endgültige kanonische Quelle.",
    },
  },
  {
    key: "ja",
    label: "日本語",
    readmeFile: "README.ja.md",
    docsDir: "ja",
    whitepaperDir: "ja",
    whitepaperFile: "docs/whitepaper/ja/WHITEPAPER.ja.md",
    copy: {
      title: "ION — 超デジタル文明のためのオペレーティングシステム",
      intro:
        "これは ION DEX の日本語公開概要ページです。プロジェクト、ドキュメント、whitepaper 概要へ同一言語で連続して入れる入口を提供します。",
      briefHeading: "ION DEX 概要",
      bullets: [
        "28 チェーン DEX と集約型の取引・インフラ入口。",
        "ユーザー、merchant、プラットフォーム向けの低摩擦マルチチェーン決済。",
        "identity、proof、reputation、検証可能な履歴を束ねる統合レイヤー。",
        "AI Sentinel、防御、仲裁、協調のための長期アーキテクチャ。",
        "fee burn、staking、treasury を軸にした長期 value flywheel。",
      ],
      statusHeading: "現在の公開ステータス",
      status:
        "公開リポジトリが現在検証できるのは、README / docs / whitepaper 公開資料、UI foundations、typed backend/data routes、verification tooling、contract scaffolding です。多くのモジュールはまだ roadmap または draft design の段階にあります。",
      startHeading: "ここから開始",
      nextHeading: "次に読むもの",
      docsHubTitle: "ION DEX ドキュメントハブ",
      docsHubIntro:
        "このページは ION DEX ドキュメントへの日本語入口であり、ローカル README、whitepaper 概要、英語の正準技術文書をつなぎます。",
      whitepaperIndexTitle: "ION DEX whitepaper インデックス",
      whitepaperIndexIntro:
        "このページは日本語の whitepaper 読書ルートであり、長期ビジョン、主要モジュール、推奨読書順を素早く理解するための入口です。",
      whitepaperTitle: "ION DEX whitepaper（日本語概要版）",
      whitepaperIntro:
        "ION DEX は long-horizon infrastructure として提示されます。28-chain DEX から始まり、payments、identity、proof、arbitration、coordination、AI Sentinel defense へ拡張します。",
      whitepaperCoversHeading: "この whitepaper が扱うもの",
      whitepaperBullets: [
        "DEX、liquidity、routing、settlement の長期的位置づけ。",
        "payments、merchants、cross-border e-commerce への拡張。",
        "identity、proof、reputation、civil layer の設計。",
        "AI arbitration、Sentinel defense、governance の境界。",
        "burn、staking、treasury、roadmap のフレームワーク。",
      ],
      boundaryHeading: "現在の境界",
      boundary:
        "最終的な wording、economics、security boundaries、release status については英語 whitepaper が引き続き正準ソースです。言語版の間に曖昧さがある場合は、英語原文と公開済みの audited on-chain / contract 資料が優先されます。",
      continueHeading: "続きを読む",
      docsHubLabel: "ドキュメントハブ",
      whitepaperOverviewLabel: "whitepaper 概要",
      whitepaperIndexLabel: "whitepaper インデックス",
      explorerLabel: "Explorer",
      localReadmeLabel: "この言語の README",
      englishWhitepaperLabel: "英語版フル whitepaper",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "注記：この言語ルートは安定した公開読書入口を提供します。最終的な正準ソースは引き続き英語の公開文書です。",
    },
  },
  {
    key: "ko",
    label: "한국어",
    readmeFile: "README.ko.md",
    docsDir: "ko",
    whitepaperDir: "ko",
    whitepaperFile: "docs/whitepaper/ko/WHITEPAPER.ko.md",
    copy: {
      title: "ION — 초디지털 문명을 위한 운영체제",
      intro:
        "이 페이지는 ION DEX의 한국어 공개 개요입니다. 프로젝트, 문서, whitepaper 개요로 이어지는 동일 언어 진입 경로를 제공합니다.",
      briefHeading: "ION DEX 한눈에 보기",
      bullets: [
        "28체인 DEX와 집계형 거래·인프라 진입면.",
        "사용자, merchant, 플랫폼을 위한 저마찰 멀티체인 결제 인프라.",
        "identity, proof, reputation, 검증 가능한 이력을 묶는 통합 레이어.",
        "AI Sentinel, 방어, 중재, 협조를 위한 장기 아키텍처.",
        "fee burn, staking, treasury를 중심으로 한 장기 value flywheel.",
      ],
      statusHeading: "현재 공개 상태",
      status:
        "공개 저장소가 현재 검증해 주는 것은 README / docs / whitepaper 공개 자료, UI foundations, typed backend/data routes, verification tooling, contract scaffolding입니다. 많은 모듈은 아직 roadmap 또는 draft design 단계에 있습니다.",
      startHeading: "여기서 시작",
      nextHeading: "다음 읽을거리",
      docsHubTitle: "ION DEX 문서 허브",
      docsHubIntro:
        "이 페이지는 ION DEX 문서로 들어가는 한국어 게이트웨이이며, 로컬 README, whitepaper 개요, 영어 정본 기술 문서를 연결합니다.",
      whitepaperIndexTitle: "ION DEX whitepaper 인덱스",
      whitepaperIndexIntro:
        "이 페이지는 장기 비전, 핵심 모듈, 권장 읽기 순서를 빠르게 이해하기 위한 한국어 whitepaper 읽기 경로입니다.",
      whitepaperTitle: "ION DEX whitepaper (한국어 요약판)",
      whitepaperIntro:
        "ION DEX는 long-horizon infrastructure로 제시됩니다. 28-chain DEX에서 시작해 payments, identity, proof, arbitration, coordination, AI Sentinel defense로 확장됩니다.",
      whitepaperCoversHeading: "이 whitepaper가 다루는 내용",
      whitepaperBullets: [
        "DEX, liquidity, routing, settlement의 장기적 위치.",
        "payments, merchants, cross-border e-commerce로의 확장 방향.",
        "identity, proof, reputation, civil layer 설계.",
        "AI arbitration, Sentinel defense, governance의 경계.",
        "burn, staking, treasury, roadmap 프레임워크.",
      ],
      boundaryHeading: "현재 경계",
      boundary:
        "최종 wording, economics, security boundaries, release status에 대해서는 영어 whitepaper가 여전히 정본입니다. 언어판 사이에 모호성이 생기면 영어 원문과 공개된 audited on-chain / contract 자료가 우선합니다.",
      continueHeading: "계속 읽기",
      docsHubLabel: "문서 허브",
      whitepaperOverviewLabel: "whitepaper 개요",
      whitepaperIndexLabel: "whitepaper 인덱스",
      explorerLabel: "Explorer",
      localReadmeLabel: "이 언어의 README",
      englishWhitepaperLabel: "영문 전체 whitepaper",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "참고: 이 언어 경로는 안정적인 공개 읽기 입구를 제공합니다. 최종 정본은 여전히 영어 공개 문서입니다.",
    },
  },
  {
    key: "hi",
    label: "हिन्दी",
    readmeFile: "README.hi.md",
    docsDir: "hi",
    whitepaperDir: "hi",
    whitepaperFile: "docs/whitepaper/hi/WHITEPAPER.hi.md",
    copy: {
      title: "ION — एक सुपर डिजिटल सभ्यता के लिए ऑपरेटिंग सिस्टम",
      intro:
        "यह ION DEX का हिन्दी सार्वजनिक अवलोकन पृष्ठ है। यह परियोजना, दस्तावेज़ और whitepaper overview तक एक ही भाषा में लगातार प्रवेश देता है।",
      briefHeading: "संक्षेप में ION DEX",
      bullets: [
        "28-chain DEX और trading / infrastructure के लिए aggregated entry surface.",
        "उपयोगकर्ताओं, merchants और platforms के लिए low-friction multi-chain payments.",
        "identity, proof, reputation और verifiable history के लिए unified layer.",
        "AI Sentinel, defense, arbitration और coordination के लिए long-horizon architecture.",
        "fee burn, staking और treasury पर आधारित long-term value flywheel.",
      ],
      statusHeading: "वर्तमान सार्वजनिक स्थिति",
      status:
        "सार्वजनिक repository अभी यह साबित करती है: README / docs / whitepaper public materials, UI foundations, typed backend/data routes, verification tooling और contract scaffolding. कई modules अभी भी roadmap या draft design स्तर पर हैं।",
      startHeading: "यहाँ से शुरू करें",
      nextHeading: "आगे क्या पढ़ें",
      docsHubTitle: "ION DEX Documentation Hub",
      docsHubIntro:
        "यह पृष्ठ ION DEX documentation के लिए हिन्दी gateway है और local README, whitepaper overview तथा canonical English technical docs को जोड़ता है।",
      whitepaperIndexTitle: "ION DEX whitepaper index",
      whitepaperIndexIntro:
        "यह पृष्ठ हिन्दी whitepaper reading path है ताकि long-term vision, core modules और reading order को जल्दी समझा जा सके।",
      whitepaperTitle: "ION DEX whitepaper (हिन्दी सार संस्करण)",
      whitepaperIntro:
        "ION DEX को long-horizon infrastructure के रूप में प्रस्तुत किया गया है: 28-chain DEX से शुरू होकर यह payments, identity, proof, arbitration, coordination और AI Sentinel defense तक फैलता है।",
      whitepaperCoversHeading: "यह whitepaper क्या कवर करती है",
      whitepaperBullets: [
        "DEX, liquidity, routing और settlement की long-term position.",
        "payments, merchants और cross-border e-commerce की expansion direction.",
        "identity, proof, reputation और civil layer design.",
        "AI arbitration, Sentinel defense और governance boundaries.",
        "burn, staking, treasury और roadmap framework.",
      ],
      boundaryHeading: "वर्तमान सीमा",
      boundary:
        "final wording, economics, security boundaries और release status के लिए English whitepaper अभी भी canonical source है। अगर language versions के बीच ambiguity आती है, तो English text और published audited on-chain / contract materials को प्राथमिकता मिलेगी।",
      continueHeading: "पढ़ना जारी रखें",
      docsHubLabel: "Documentation Hub",
      whitepaperOverviewLabel: "whitepaper overview",
      whitepaperIndexLabel: "whitepaper index",
      explorerLabel: "Explorer",
      localReadmeLabel: "इस भाषा का README",
      englishWhitepaperLabel: "अंग्रेज़ी पूर्ण whitepaper",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "नोट: यह भाषा-पथ स्थिर public reading entry देता है; अंतिम canonical source अब भी English public documents हैं।",
    },
  },
  {
    key: "tr",
    label: "Türkçe",
    readmeFile: "README.tr.md",
    docsDir: "tr",
    whitepaperDir: "tr",
    whitepaperFile: "docs/whitepaper/tr/WHITEPAPER.tr.md",
    copy: {
      title: "ION — Süper dijital bir uygarlık için işletim sistemi",
      intro:
        "Bu sayfa ION DEX için Türkçe kamuya açık genel bakıştır. Proje, dokümantasyon ve whitepaper overview için aynı dilde kesintisiz bir giriş sağlar.",
      briefHeading: "Kısaca ION DEX",
      bullets: [
        "28-chain DEX ve trading / infrastructure için agregasyon yüzeyi.",
        "Kullanıcılar, merchant'lar ve platformlar için düşük sürtünmeli multi-chain payments.",
        "identity, proof, reputation ve doğrulanabilir history için birleşik katman.",
        "AI Sentinel, defense, arbitration ve coordination için long-horizon architecture.",
        "fee burn, staking ve treasury etrafında uzun vadeli value flywheel.",
      ],
      statusHeading: "Mevcut kamuya açık durum",
      status:
        "Kamuya açık repository bugün şunları doğruluyor: README / docs / whitepaper public materials, UI foundations, typed backend/data routes, verification tooling ve contract scaffolding. Birçok modül hâlâ roadmap veya draft design aşamasında.",
      startHeading: "Buradan başlayın",
      nextHeading: "Sonraki okuma",
      docsHubTitle: "ION DEX dokümantasyon merkezi",
      docsHubIntro:
        "Bu sayfa ION DEX dokümantasyonu için Türkçe giriş kapısıdır ve yerel README, whitepaper overview ve canonical English technical docs bağlantılarını birleştirir.",
      whitepaperIndexTitle: "ION DEX whitepaper dizini",
      whitepaperIndexIntro:
        "Bu sayfa uzun vadeli vizyonu, ana modülleri ve önerilen okuma sırasını hızlıca anlamak için Türkçe whitepaper okuma rotasıdır.",
      whitepaperTitle: "ION DEX whitepaper (Türkçe özet sürüm)",
      whitepaperIntro:
        "ION DEX long-horizon infrastructure olarak tanımlanır: 28-chain DEX ile başlar ve payments, identity, proof, arbitration, coordination ve AI Sentinel defense alanlarına genişler.",
      whitepaperCoversHeading: "Bu whitepaper neleri kapsar",
      whitepaperBullets: [
        "DEX, liquidity, routing ve settlement'ın uzun vadeli konumu.",
        "payments, merchants ve cross-border e-commerce yönündeki genişleme.",
        "identity, proof, reputation ve civil layer tasarımı.",
        "AI arbitration, Sentinel defense ve governance sınırları.",
        "burn, staking, treasury ve roadmap çerçevesi.",
      ],
      boundaryHeading: "Mevcut sınır",
      boundary:
        "Final wording, economics, security boundaries ve release status için English whitepaper hâlâ canonical source'tur. Dil sürümleri arasında belirsizlik oluşursa English text ve yayımlanmış audited on-chain / contract materials önceliklidir.",
      continueHeading: "Okumaya devam et",
      docsHubLabel: "Dokümantasyon merkezi",
      whitepaperOverviewLabel: "whitepaper özeti",
      whitepaperIndexLabel: "whitepaper dizini",
      explorerLabel: "Explorer",
      localReadmeLabel: "Bu dilde README",
      englishWhitepaperLabel: "İngilizce tam whitepaper",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "Not: Bu dil yolu istikrarlı bir public reading entry sağlar; nihai canonical source İngilizce public documents olmaya devam eder.",
    },
  },
  {
    key: "it",
    label: "Italiano",
    readmeFile: "README.it.md",
    docsDir: "it",
    whitepaperDir: "it",
    whitepaperFile: "docs/whitepaper/it/WHITEPAPER.it.md",
    copy: {
      title: "ION — Il sistema operativo per una super civiltà digitale",
      intro:
        "Questa è la pagina pubblica di panoramica in italiano per ION DEX. Fornisce un ingresso continuo nella stessa lingua verso il progetto, la documentazione e il whitepaper overview.",
      briefHeading: "ION DEX in breve",
      bullets: [
        "Un DEX a 28 chain e una superficie aggregata per trading e infrastruttura.",
        "Pagamenti multi-chain a bassa frizione per utenti, merchant e piattaforme.",
        "Un layer unificato per identity, proof, reputation e storia verificabile.",
        "Un'architettura di lungo periodo per AI Sentinel, difesa, arbitraggio e coordinamento.",
        "Un value flywheel di lungo periodo basato su fee burn, staking e treasury.",
      ],
      statusHeading: "Stato pubblico attuale",
      status:
        "Il repository pubblico oggi dimostra: materiali pubblici README / docs / whitepaper, UI foundations, typed backend/data routes, verification tooling e contract scaffolding. Molti moduli restano ancora roadmap o draft design.",
      startHeading: "Inizia da qui",
      nextHeading: "Letture successive",
      docsHubTitle: "Centro documentazione ION DEX",
      docsHubIntro:
        "Questa pagina è il gateway italiano alla documentazione di ION DEX e collega il README locale, il whitepaper overview e i documenti tecnici canonici in inglese.",
      whitepaperIndexTitle: "Indice del whitepaper ION DEX",
      whitepaperIndexIntro:
        "Questa pagina è il percorso di lettura italiano del whitepaper per comprendere rapidamente la visione di lungo periodo, i moduli chiave e l'ordine di lettura.",
      whitepaperTitle: "Whitepaper ION DEX (edizione sintetica in italiano)",
      whitepaperIntro:
        "ION DEX viene descritto come un'infrastruttura di lungo orizzonte: parte da un 28-chain DEX e si espande verso payments, identity, proof, arbitration, coordination e AI Sentinel defense.",
      whitepaperCoversHeading: "Cosa copre questo whitepaper",
      whitepaperBullets: [
        "Il posizionamento di lungo periodo di DEX, liquidity, routing e settlement.",
        "L'espansione verso payments, merchants e cross-border e-commerce.",
        "Il design di identity, proof, reputation e civil layer.",
        "I confini di AI arbitration, Sentinel defense e governance.",
        "Il framework di burn, staking, treasury e roadmap.",
      ],
      boundaryHeading: "Confine attuale",
      boundary:
        "Il whitepaper inglese resta la fonte canonica per wording finale, economics, security boundaries e release status. Se tra le versioni linguistiche emerge ambiguità, prevalgono il testo inglese e i materiali audited on-chain / contract già pubblicati.",
      continueHeading: "Continua a leggere",
      docsHubLabel: "Centro documentazione",
      whitepaperOverviewLabel: "Panoramica whitepaper",
      whitepaperIndexLabel: "Indice whitepaper",
      explorerLabel: "Explorer",
      localReadmeLabel: "README in questa lingua",
      englishWhitepaperLabel: "Whitepaper completa in inglese",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "Nota: questo percorso linguistico offre un ingresso pubblico stabile di lettura; i documenti pubblici in inglese restano la fonte canonica finale.",
    },
  },
  {
    key: "id",
    label: "Bahasa Indonesia",
    readmeFile: "README.id.md",
    docsDir: "id",
    whitepaperDir: "id",
    whitepaperFile: "docs/whitepaper/id/WHITEPAPER.id.md",
    copy: {
      title: "ION — Sistem operasi untuk peradaban digital super",
      intro:
        "Ini adalah halaman ringkasan publik ION DEX dalam Bahasa Indonesia. Halaman ini memberi jalur masuk berbahasa sama menuju proyek, dokumentasi, dan whitepaper overview.",
      briefHeading: "ION DEX secara ringkas",
      bullets: [
        "DEX 28-chain dan permukaan agregasi untuk trading serta infrastruktur.",
        "Pembayaran multi-chain dengan friksi rendah untuk pengguna, merchant, dan platform.",
        "Lapisan terpadu untuk identity, proof, reputation, dan riwayat yang dapat diverifikasi.",
        "Arsitektur jangka panjang untuk AI Sentinel, defense, arbitration, dan coordination.",
        "Value flywheel jangka panjang berbasis fee burn, staking, dan treasury.",
      ],
      statusHeading: "Status publik saat ini",
      status:
        "Repository publik saat ini membuktikan: materi publik README / docs / whitepaper, UI foundations, typed backend/data routes, verification tooling, dan contract scaffolding. Banyak modul masih berada pada tahap roadmap atau draft design.",
      startHeading: "Mulai dari sini",
      nextHeading: "Bacaan berikutnya",
      docsHubTitle: "Pusat dokumentasi ION DEX",
      docsHubIntro:
        "Halaman ini adalah gerbang dokumentasi ION DEX dalam Bahasa Indonesia dan menghubungkan README lokal, whitepaper overview, serta dokumen teknis kanonis berbahasa Inggris.",
      whitepaperIndexTitle: "Indeks whitepaper ION DEX",
      whitepaperIndexIntro:
        "Halaman ini adalah jalur baca whitepaper dalam Bahasa Indonesia untuk memahami visi jangka panjang, modul inti, dan urutan baca dengan cepat.",
      whitepaperTitle: "Whitepaper ION DEX (edisi ringkas Bahasa Indonesia)",
      whitepaperIntro:
        "ION DEX dipaparkan sebagai infrastruktur jangka panjang: dimulai dari 28-chain DEX lalu meluas ke payments, identity, proof, arbitration, coordination, dan AI Sentinel defense.",
      whitepaperCoversHeading: "Apa yang dicakup whitepaper ini",
      whitepaperBullets: [
        "Posisi jangka panjang DEX, liquidity, routing, dan settlement.",
        "Arah ekspansi ke payments, merchants, dan cross-border e-commerce.",
        "Desain identity, proof, reputation, dan civil layer.",
        "Batas AI arbitration, Sentinel defense, dan governance.",
        "Kerangka burn, staking, treasury, dan roadmap.",
      ],
      boundaryHeading: "Batas saat ini",
      boundary:
        "Whitepaper berbahasa Inggris tetap menjadi sumber kanonis untuk wording final, economics, security boundaries, dan release status. Jika ada ambiguitas antarversi bahasa, teks Inggris dan materi audited on-chain / contract yang telah dipublikasikan menjadi acuan.",
      continueHeading: "Lanjut membaca",
      docsHubLabel: "Pusat dokumentasi",
      whitepaperOverviewLabel: "Ringkasan whitepaper",
      whitepaperIndexLabel: "Indeks whitepaper",
      explorerLabel: "Explorer",
      localReadmeLabel: "README dalam bahasa ini",
      englishWhitepaperLabel: "Whitepaper lengkap bahasa Inggris",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "Catatan: jalur bahasa ini menyediakan pintu baca publik yang stabil; dokumen publik berbahasa Inggris tetap menjadi sumber kanonis final.",
    },
  },
  {
    key: "vi",
    label: "Tiếng Việt",
    readmeFile: "README.vi.md",
    docsDir: "vi",
    whitepaperDir: "vi",
    whitepaperFile: "docs/whitepaper/vi/WHITEPAPER.vi.md",
    copy: {
      title: "ION — Hệ điều hành cho một nền văn minh số siêu quy mô",
      intro:
        "Đây là trang tổng quan công khai bằng Tiếng Việt của ION DEX. Trang này cung cấp một lối vào liên tục cùng ngôn ngữ tới dự án, tài liệu và phần tóm tắt whitepaper.",
      briefHeading: "ION DEX trong ngắn gọn",
      bullets: [
        "DEX 28-chain và bề mặt tổng hợp cho giao dịch và hạ tầng.",
        "Thanh toán multi-chain ma sát thấp cho người dùng, merchant và nền tảng.",
        "Lớp thống nhất cho identity, proof, reputation và lịch sử có thể xác minh.",
        "Kiến trúc dài hạn cho AI Sentinel, defense, arbitration và coordination.",
        "Value flywheel dài hạn dựa trên fee burn, staking và treasury.",
      ],
      statusHeading: "Trạng thái công khai hiện tại",
      status:
        "Kho mã công khai hiện đang chứng minh: tài liệu README / docs / whitepaper công khai, UI foundations, typed backend/data routes, verification tooling và contract scaffolding. Nhiều mô-đun vẫn ở mức roadmap hoặc draft design.",
      startHeading: "Bắt đầu từ đây",
      nextHeading: "Đọc tiếp theo",
      docsHubTitle: "Trung tâm tài liệu ION DEX",
      docsHubIntro:
        "Trang này là cổng tài liệu Tiếng Việt cho ION DEX, kết nối README cục bộ, whitepaper overview và các tài liệu kỹ thuật canonical bằng tiếng Anh.",
      whitepaperIndexTitle: "Chỉ mục whitepaper ION DEX",
      whitepaperIndexIntro:
        "Trang này là lộ trình đọc whitepaper bằng Tiếng Việt để nhanh chóng hiểu tầm nhìn dài hạn, các mô-đun cốt lõi và thứ tự đọc được đề xuất.",
      whitepaperTitle: "Whitepaper ION DEX (bản tóm tắt Tiếng Việt)",
      whitepaperIntro:
        "ION DEX được mô tả như một hạ tầng long-horizon: bắt đầu từ một 28-chain DEX rồi mở rộng sang payments, identity, proof, arbitration, coordination và AI Sentinel defense.",
      whitepaperCoversHeading: "Whitepaper này bao quát điều gì",
      whitepaperBullets: [
        "Vị thế dài hạn của DEX, liquidity, routing và settlement.",
        "Hướng mở rộng sang payments, merchants và cross-border e-commerce.",
        "Thiết kế của identity, proof, reputation và civil layer.",
        "Ranh giới của AI arbitration, Sentinel defense và governance.",
        "Khung burn, staking, treasury và roadmap.",
      ],
      boundaryHeading: "Ranh giới hiện tại",
      boundary:
        "Whitepaper tiếng Anh vẫn là nguồn canonical cho wording cuối cùng, economics, security boundaries và release status. Nếu có điểm mơ hồ giữa các ngôn ngữ, văn bản tiếng Anh và các tài liệu audited on-chain / contract đã công bố sẽ được ưu tiên.",
      continueHeading: "Tiếp tục đọc",
      docsHubLabel: "Trung tâm tài liệu",
      whitepaperOverviewLabel: "Tổng quan whitepaper",
      whitepaperIndexLabel: "Chỉ mục whitepaper",
      explorerLabel: "Explorer",
      localReadmeLabel: "README bằng ngôn ngữ này",
      englishWhitepaperLabel: "Whitepaper đầy đủ tiếng Anh",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "Ghi chú: nhánh ngôn ngữ này cung cấp một lối vào đọc công khai ổn định; các tài liệu công khai tiếng Anh vẫn là nguồn canonical cuối cùng.",
    },
  },
  {
    key: "th",
    label: "ไทย",
    readmeFile: "README.th.md",
    docsDir: "th",
    whitepaperDir: "th",
    whitepaperFile: "docs/whitepaper/th/WHITEPAPER.th.md",
    copy: {
      title: "ION — ระบบปฏิบัติการสำหรับอารยธรรมดิจิทัลระดับเหนือชั้น",
      intro:
        "นี่คือหน้าภาพรวมสาธารณะภาษาไทยของ ION DEX ซึ่งให้เส้นทางเข้าถึงโครงการ เอกสาร และ whitepaper overview ในภาษาเดียวกันอย่างต่อเนื่อง",
      briefHeading: "ION DEX โดยสรุป",
      bullets: [
        "DEX แบบ 28-chain และพื้นผิวรวมศูนย์สำหรับการเทรดและโครงสร้างพื้นฐาน",
        "ระบบชำระเงิน multi-chain แบบแรงเสียดทานต่ำสำหรับผู้ใช้ merchant และแพลตฟอร์ม",
        "ชั้นรวมสำหรับ identity, proof, reputation และประวัติที่ตรวจสอบได้",
        "สถาปัตยกรรมระยะยาวสำหรับ AI Sentinel, defense, arbitration และ coordination",
        "value flywheel ระยะยาวที่อิงกับ fee burn, staking และ treasury",
      ],
      statusHeading: "สถานะสาธารณะปัจจุบัน",
      status:
        "repository สาธารณะในตอนนี้พิสูจน์ได้ว่า มีวัสดุ README / docs / whitepaper สาธารณะ, UI foundations, typed backend/data routes, verification tooling และ contract scaffolding ขณะที่หลายโมดูลยังอยู่ในระดับ roadmap หรือ draft design",
      startHeading: "เริ่มที่นี่",
      nextHeading: "อ่านต่อ",
      docsHubTitle: "ศูนย์เอกสาร ION DEX",
      docsHubIntro:
        "หน้านี้เป็นประตูเอกสารภาษาไทยของ ION DEX เชื่อม README ภาษานี้, whitepaper overview และเอกสารเทคนิค canonical ภาษาอังกฤษเข้าด้วยกัน",
      whitepaperIndexTitle: "ดัชนี whitepaper ของ ION DEX",
      whitepaperIndexIntro:
        "หน้านี้คือเส้นทางอ่าน whitepaper ภาษาไทยเพื่อเข้าใจวิสัยทัศน์ระยะยาว โมดูลหลัก และลำดับการอ่านที่แนะนำได้อย่างรวดเร็ว",
      whitepaperTitle: "Whitepaper ION DEX (ฉบับสรุปภาษาไทย)",
      whitepaperIntro:
        "ION DEX ถูกอธิบายว่าเป็น long-horizon infrastructure: เริ่มจาก 28-chain DEX แล้วขยายไปสู่ payments, identity, proof, arbitration, coordination และ AI Sentinel defense",
      whitepaperCoversHeading: "whitepaper นี้ครอบคลุมอะไร",
      whitepaperBullets: [
        "บทบาทระยะยาวของ DEX, liquidity, routing และ settlement",
        "ทิศทางการขยายไปสู่ payments, merchants และ cross-border e-commerce",
        "การออกแบบ identity, proof, reputation และ civil layer",
        "ขอบเขตของ AI arbitration, Sentinel defense และ governance",
        "กรอบ burn, staking, treasury และ roadmap",
      ],
      boundaryHeading: "ขอบเขตปัจจุบัน",
      boundary:
        "whitepaper ภาษาอังกฤษยังคงเป็นแหล่ง canonical สำหรับ wording สุดท้าย, economics, security boundaries และ release status หากมีความกำกวมระหว่างภาษา ให้ยึดข้อความภาษาอังกฤษและเอกสาร audited on-chain / contract ที่เผยแพร่แล้วเป็นหลัก",
      continueHeading: "อ่านต่อ",
      docsHubLabel: "ศูนย์เอกสาร",
      whitepaperOverviewLabel: "ภาพรวม whitepaper",
      whitepaperIndexLabel: "ดัชนี whitepaper",
      explorerLabel: "Explorer",
      localReadmeLabel: "README ภาษานี้",
      englishWhitepaperLabel: "whitepaper ฉบับเต็มภาษาอังกฤษ",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "หมายเหตุ: เส้นทางภาษานี้ให้จุดเริ่มอ่านสาธารณะที่เสถียร แต่เอกสารสาธารณะภาษาอังกฤษยังคงเป็น canonical source ขั้นสุดท้าย",
    },
  },
  {
    key: "pl",
    label: "Polski",
    readmeFile: "README.pl.md",
    docsDir: "pl",
    whitepaperDir: "pl",
    whitepaperFile: "docs/whitepaper/pl/WHITEPAPER.pl.md",
    copy: {
      title: "ION — System operacyjny dla supercyfrowej cywilizacji",
      intro:
        "To jest publiczna strona przeglądowa ION DEX w języku polskim. Zapewnia spójne wejście w tym samym języku do projektu, dokumentacji i przeglądu whitepaper.",
      briefHeading: "ION DEX w skrócie",
      bullets: [
        "28-chain DEX i zagregowana powierzchnia dla handlu oraz infrastruktury.",
        "Niskotarciowe płatności multi-chain dla użytkowników, merchantów i platform.",
        "Wspólna warstwa identity, proof, reputation i weryfikowalnej historii.",
        "Długoterminowa architektura dla AI Sentinel, defense, arbitration i coordination.",
        "Długoterminowy value flywheel oparty o fee burn, staking i treasury.",
      ],
      statusHeading: "Obecny status publiczny",
      status:
        "Publiczne repozytorium potwierdza dziś: publiczne materiały README / docs / whitepaper, UI foundations, typed backend/data routes, verification tooling oraz contract scaffolding. Wiele modułów nadal pozostaje na etapie roadmap lub draft design.",
      startHeading: "Zacznij tutaj",
      nextHeading: "Co czytać dalej",
      docsHubTitle: "Centrum dokumentacji ION DEX",
      docsHubIntro:
        "Ta strona jest polskojęzyczną bramą do dokumentacji ION DEX i łączy lokalne README, whitepaper overview oraz kanoniczne techniczne dokumenty po angielsku.",
      whitepaperIndexTitle: "Indeks whitepaper ION DEX",
      whitepaperIndexIntro:
        "Ta strona jest polskojęzyczną ścieżką czytania whitepaper, aby szybko zrozumieć długoterminową wizję, kluczowe moduły i zalecaną kolejność lektury.",
      whitepaperTitle: "Whitepaper ION DEX (polska wersja skrócona)",
      whitepaperIntro:
        "ION DEX jest opisywany jako long-horizon infrastructure: zaczyna się od 28-chain DEX i rozszerza się na payments, identity, proof, arbitration, coordination oraz AI Sentinel defense.",
      whitepaperCoversHeading: "Co obejmuje to whitepaper",
      whitepaperBullets: [
        "Długoterminową rolę DEX, liquidity, routing i settlement.",
        "Rozszerzenie w stronę payments, merchants i cross-border e-commerce.",
        "Projekt identity, proof, reputation i civil layer.",
        "Granice AI arbitration, Sentinel defense i governance.",
        "Framework burn, staking, treasury i roadmap.",
      ],
      boundaryHeading: "Obecna granica",
      boundary:
        "Angielskie whitepaper pozostaje kanonicznym źródłem dla final wording, economics, security boundaries i release status. Jeśli między wersjami językowymi pojawi się niejednoznaczność, pierwszeństwo mają tekst angielski i opublikowane audited on-chain / contract materials.",
      continueHeading: "Czytaj dalej",
      docsHubLabel: "Centrum dokumentacji",
      whitepaperOverviewLabel: "Przegląd whitepaper",
      whitepaperIndexLabel: "Indeks whitepaper",
      explorerLabel: "Explorer",
      localReadmeLabel: "README w tym języku",
      englishWhitepaperLabel: "Pełne whitepaper po angielsku",
      englishDeveloperLabel: "English Developer Index",
      canonicalNote:
        "Uwaga: ta ścieżka językowa zapewnia stabilne publiczne wejście do czytania; angielskie publiczne dokumenty pozostają ostatecznym kanonicznym źródłem.",
    },
  },
];

function readmeLink(language) {
  return `./${language.readmeFile}`;
}

function docsHubPath(language) {
  return language.key === "en" ? "./docs/README.md" : `./docs/${language.docsDir}/index.md`;
}

function whitepaperIndexPath(language) {
  return language.key === "en" ? "./docs/whitepaper-index.md" : `./docs/${language.docsDir}/whitepaper-index.md`;
}

function whitepaperPath(language) {
  return language.key === "en" ? "./docs/WHITEPAPER.md" : `./${language.whitepaperFile}`;
}

function buildReadmeNav(current) {
  return `**Languages:** ${languages.map((language) => `[${language.label}](${language.key === current.key ? readmeLink(language) : readmeLink(language)})`).join(" | ")}`;
}

function buildDocsNav(current) {
  return `**Languages:** ${languages.map((language) => {
    let href;
    if (current.key === "en") {
      href = language.key === "en" ? "./README.md" : `./${language.docsDir}/index.md`;
    } else {
      href = language.key === "en" ? "../README.md" : language.docsDir === current.docsDir ? "./index.md" : `../${language.docsDir}/index.md`;
    }
    return `[${language.label}](${href})`;
  }).join(" | ")}`;
}

function buildWhitepaperIndexNav(current) {
  return `**Languages:** ${languages.map((language) => {
    let href;
    if (current.key === "en") {
      href = language.key === "en" ? "./whitepaper-index.md" : `./${language.docsDir}/whitepaper-index.md`;
    } else {
      href = language.key === "en" ? "../whitepaper-index.md" : language.docsDir === current.docsDir ? "./whitepaper-index.md" : `../${language.docsDir}/whitepaper-index.md`;
    }
    return `[${language.label}](${href})`;
  }).join(" | ")}`;
}

function buildWhitepaperNav(current) {
  return `**Languages:** ${languages.map((language) => {
    let href;
    if (language.key === "en") {
      href = "../../WHITEPAPER.md";
    } else if (language.whitepaperDir === current.whitepaperDir) {
      href = `./${path.posix.basename(language.whitepaperFile)}`;
    } else {
      href = `../${language.whitepaperDir}/${path.posix.basename(language.whitepaperFile)}`;
    }
    return `[${language.label}](${href})`;
  }).join(" | ")}`;
}

function buildDocsLeafNav(current, leaf) {
  return `**Languages:** ${languages.map((language) => {
    let href;
    if (current.key === "en") {
      href = language.key === "en" ? `./${leaf}` : `./${language.docsDir}/${leaf}`;
    } else {
      href = language.key === "en" ? `../${leaf}` : language.docsDir === current.docsDir ? `./${leaf}` : `../${language.docsDir}/${leaf}`;
    }
    return `[${language.label}](${href})`;
  }).join(" | ")}`;
}

const localizedLeafPages = [
  {
    slug: "developer-index.md",
    title: "Developer Index",
    related: ["api-overview.md", "contracts-overview.md", "sdk-overview.md", "quick-start.md"],
  },
  {
    slug: "api-overview.md",
    title: "API Overview",
    related: ["developer-index.md", "contracts-overview.md", "sdk-overview.md", "quick-start.md"],
  },
  {
    slug: "contracts-overview.md",
    title: "Contracts Overview",
    related: ["developer-index.md", "api-overview.md", "sdk-overview.md", "quick-start.md"],
  },
  {
    slug: "sdk-overview.md",
    title: "SDK Overview",
    related: ["developer-index.md", "api-overview.md", "contracts-overview.md", "quick-start.md"],
  },
  {
    slug: "quick-start.md",
    title: "Quick Start",
    related: ["developer-index.md", "api-overview.md", "contracts-overview.md", "sdk-overview.md"],
  },
  {
    slug: "merchant-onboarding.md",
    title: "Merchant Onboarding",
    related: ["payment-access.md", "settlement-integration.md", "ecosystem-entry.md"],
  },
  {
    slug: "payment-access.md",
    title: "Payment Access",
    related: ["merchant-onboarding.md", "settlement-integration.md", "ecosystem-entry.md"],
  },
  {
    slug: "settlement-integration.md",
    title: "Settlement Integration",
    related: ["merchant-onboarding.md", "payment-access.md", "ecosystem-entry.md"],
  },
  {
    slug: "ecosystem-entry.md",
    title: "Ecosystem Entry",
    related: ["merchant-onboarding.md", "payment-access.md", "settlement-integration.md", "public-structure.md"],
  },
  {
    slug: "public-structure.md",
    title: "Public Structure",
    related: ["roadmap-guide.md", "ecosystem-entry.md", "developer-index.md"],
  },
  {
    slug: "roadmap-guide.md",
    title: "Roadmap Guide",
    related: ["public-structure.md", "developer-index.md", "merchant-onboarding.md"],
  },
];

function englishDocsHub() {
  return `${buildDocsNav(languages[0])}

# ION DEX Documentation Hub

This page is the public documentation gateway for the repository-local reading paths that accompany the multilingual README and whitepaper editions.

## Start Here

- [README](../README.md)
- [Whitepaper Index](./whitepaper-index.md)
- [Whitepaper](./WHITEPAPER.md)
- [Developer Index](./developer-index.md)
- [Merchant Onboarding](./merchant-onboarding.md)
- [Public Structure](./public-structure.md)
- [Roadmap Guide](./roadmap-guide.md)

## Canonical Rule

- The repository now exposes 18 language gateways for README, documentation hub, whitepaper index, and whitepaper overview.
- The English public documents remain the canonical source when wording, economics, security boundaries, or release status differs across languages.

---

Return to [README](../README.md) | [Whitepaper Index](./whitepaper-index.md) | [Developer Index](./developer-index.md)
`;
}

function englishWhitepaperIndex() {
  const editions = languages
    .filter((language) => language.key !== "en")
    .map((language) => `- [${language.label}](${language.key === "en" ? "./WHITEPAPER.md" : `./whitepaper/${language.whitepaperDir}/${path.posix.basename(language.whitepaperFile)}`})`)
    .join("\n");

  return `${buildWhitepaperIndexNav(languages[0])}

# ION DEX Whitepaper Index

This page is the public whitepaper gateway for the repository. Every listed language now has a real public reading path for the README, documentation hub, whitepaper index, and whitepaper overview.

## Primary Document

- [ION DEX Whitepaper v2.0 (English Canonical Source)](./WHITEPAPER.md)

## Language Editions

${editions}

## Reading Path

1. [README](../README.md)
2. [Documentation Hub](./README.md)
3. [Whitepaper](./WHITEPAPER.md)
4. [Developer Index](./developer-index.md)

## Canonical Rule

- The English whitepaper remains canonical for final wording, economics, security boundaries, release status, and any audited source-of-truth requirement.

---

Return to [README](../README.md) | [Documentation Hub](./README.md) | [Whitepaper](./WHITEPAPER.md)
`;
}

function renderReadme(language) {
  const copy = language.copy;
  return `${buildReadmeNav(language)}

# ${copy.title}

${copy.intro}

## ${copy.startHeading}

- [${copy.docsHubLabel}](${docsHubPath(language)})
- [${copy.whitepaperOverviewLabel}](${whitepaperPath(language)})
- [${copy.whitepaperIndexLabel}](${whitepaperIndexPath(language)})
- [${copy.explorerLabel}](https://explorer.ice.io/)

## ${copy.briefHeading}

${copy.bullets.map((item) => `- ${item}`).join("\n")}

## ${copy.statusHeading}

${copy.status}

## ${copy.nextHeading}

- [${copy.docsHubLabel}](${docsHubPath(language)})
- [${copy.whitepaperOverviewLabel}](${whitepaperPath(language)})
- [${copy.englishWhitepaperLabel}](./docs/WHITEPAPER.md)

> ${copy.canonicalNote}
`;
}

function renderDocsHub(language) {
  const copy = language.copy;
  return `${buildDocsNav(language)}

# ${copy.docsHubTitle}

${copy.docsHubIntro}

## ${copy.startHeading}

- [${copy.localReadmeLabel}](../../${language.readmeFile})
- [Developer Index](./developer-index.md)
- [Merchant Onboarding](./merchant-onboarding.md)
- [Public Structure](./public-structure.md)
- [Roadmap Guide](./roadmap-guide.md)
- [${copy.whitepaperOverviewLabel}](../whitepaper/${language.whitepaperDir}/${path.posix.basename(language.whitepaperFile)})
- [${copy.whitepaperIndexLabel}](./whitepaper-index.md)
- [${copy.englishWhitepaperLabel}](../WHITEPAPER.md)
- [${copy.englishDeveloperLabel}](../developer-index.md)

## ${copy.nextHeading}

- [API Overview](./api-overview.md)
- [Contracts Overview](./contracts-overview.md)
- [SDK Overview](./sdk-overview.md)
- [Quick Start](./quick-start.md)
- [Payment Access](./payment-access.md)
- [Settlement Integration](./settlement-integration.md)
- [Ecosystem Entry](./ecosystem-entry.md)
- [${copy.whitepaperIndexLabel}](./whitepaper-index.md)
- [${copy.whitepaperOverviewLabel}](../whitepaper/${language.whitepaperDir}/${path.posix.basename(language.whitepaperFile)})
- [${copy.englishDeveloperLabel}](../developer-index.md)

> ${copy.canonicalNote}
`;
}

function renderWhitepaperIndex(language) {
  const copy = language.copy;
  return `${buildWhitepaperIndexNav(language)}

# ${copy.whitepaperIndexTitle}

${copy.whitepaperIndexIntro}

## ${copy.startHeading}

- [${copy.whitepaperOverviewLabel}](../whitepaper/${language.whitepaperDir}/${path.posix.basename(language.whitepaperFile)})
- [${copy.localReadmeLabel}](../../${language.readmeFile})
- [${copy.docsHubLabel}](./index.md)
- [${copy.englishWhitepaperLabel}](../WHITEPAPER.md)
- [${copy.englishDeveloperLabel}](../developer-index.md)

## ${copy.nextHeading}

- [${copy.docsHubLabel}](./index.md)
- [${copy.whitepaperOverviewLabel}](../whitepaper/${language.whitepaperDir}/${path.posix.basename(language.whitepaperFile)})
- [${copy.englishWhitepaperLabel}](../WHITEPAPER.md)

> ${copy.canonicalNote}
`;
}

function renderWhitepaper(language) {
  const copy = language.copy;
  return `${buildWhitepaperNav(language)}

# ${copy.whitepaperTitle}

**Version:** 2.0  
**Date:** June 2026  
**Status:** Public Draft

${copy.whitepaperIntro}

## ${copy.whitepaperCoversHeading}

${copy.whitepaperBullets.map((item) => `- ${item}`).join("\n")}

## ${copy.boundaryHeading}

${copy.boundary}

## ${copy.continueHeading}

- [${copy.docsHubLabel}](../../${language.docsDir}/index.md)
- [${copy.whitepaperIndexLabel}](../../${language.docsDir}/whitepaper-index.md)
- [${copy.englishWhitepaperLabel}](../../WHITEPAPER.md)

> ${copy.canonicalNote}
`;
}

function renderDocsLeaf(language, page) {
  const copy = language.copy;
  return `${buildDocsLeafNav(language, page.slug)}

# ${page.title}

## ${copy.startHeading}

- [${page.title} (English)](../${page.slug})
- [${copy.docsHubLabel}](./index.md)
- [${copy.whitepaperIndexLabel}](./whitepaper-index.md)
- [${copy.whitepaperOverviewLabel}](../whitepaper/${language.whitepaperDir}/${path.posix.basename(language.whitepaperFile)})

## ${copy.nextHeading}

${page.related.map((related) => {
  const relatedPage = localizedLeafPages.find((item) => item.slug === related);
  return `- [${relatedPage ? relatedPage.title : related}](./${related})`;
}).join("\n")}

> ${copy.canonicalNote}
`;
}

function buildEnglishWhitepaperNav() {
  return `**Languages:** ${languages.map((language) => {
    const href = language.key === "en"
      ? "./WHITEPAPER.md"
      : `./whitepaper/${language.whitepaperDir}/${path.posix.basename(language.whitepaperFile)}`;
    return `[${language.label}](${href})`;
  }).join(" | ")}`;
}

async function updateEnglishWhitepaper() {
  const relativePath = "docs/WHITEPAPER.md";
  const target = path.join(root, relativePath);
  const original = await readFile(target, "utf8");
  const navBlock = [
    "<!-- AUTO-LANGUAGE-NAV START -->",
    buildEnglishWhitepaperNav(),
    "<!-- AUTO-LANGUAGE-NAV END -->",
    "",
  ].join("\n");
  const updated = original.includes("<!-- AUTO-LANGUAGE-NAV START -->")
    ? original.replace(/<!-- AUTO-LANGUAGE-NAV START -->[\s\S]*?<!-- AUTO-LANGUAGE-NAV END -->\s*/u, navBlock)
    : `${navBlock}${original}`;
  await writeFile(target, updated, "utf8");
  console.log(relativePath);
}

async function write(relativePath, content) {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content.replace(/\n/g, "\n"), "utf8");
  console.log(relativePath);
}

async function main() {
  await write("docs/README.md", englishDocsHub());
  await write("docs/whitepaper-index.md", englishWhitepaperIndex());
  await updateEnglishWhitepaper();

  for (const language of languages.filter((item) => item.key !== "en")) {
    await write(language.readmeFile, `${renderReadme(language)}\n`);
    await write(`docs/${language.docsDir}/index.md`, `${renderDocsHub(language)}\n`);
    await write(`docs/${language.docsDir}/whitepaper-index.md`, `${renderWhitepaperIndex(language)}\n`);
    await write(language.whitepaperFile, `${renderWhitepaper(language)}\n`);
  }

  for (const language of languages.filter((item) => item.key !== "en" && item.key !== "zh-CN")) {
    for (const page of localizedLeafPages) {
      await write(`docs/${language.docsDir}/${page.slug}`, `${renderDocsLeaf(language, page)}\n`);
    }
  }
}

await main();
