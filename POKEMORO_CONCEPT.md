# Pokémoro: Game Design & Conceito do Jogo

> **Gênero:** App Gamificado de Produtividade, Foco & Estudos (Pomodoro + Coleção de Criaturas)  
> **Inspiração:** *Pokémon Sleep* & *Técnica Pomodoro*  
> **Público-Alvo:** Estudantes para vestibular, concursos públicos, escola, faculdade, idiomas e concurseiros.

---

## 1. O Conceito Central: Trocar Sono por Estudo

No *Pokémon Sleep*, o sono do jogador alimenta o ecossistema. No **Pokémoro**, o combustível do jogo é o **seu tempo e consistência de estudo**.

Os Pokémon se reúnem na sua **Sala de Estudos / Biblioteca** atraídos pela sua energia de concentração. Depois de uma longa sessão focada, eles aparecem cansados e relaxando em diferentes **poses de descanso/sono** ao seu redor.

---

## 2. Equivalência de Mecânicas: Pokémon Sleep vs. Pokémoro

| Mecânica em Pokémon Sleep | Equivalente no Pokémoro | Como Funciona no App |
| :--- | :--- | :--- |
| **Sessão de Sono** | **Sessão de Foco / Pomodoro** | Timer customizável (25min, 50min ou contagem livre). Modo foco com áudios ambiente (lo-fi, chuva, biblioteca). |
| **Drowsy Power (Poder de Sono)** | **Focus Power (Poder de Foco)** | Calculado com base em: `Minutos Estudados x Multiplicador de Ofensiva (Streak)`. Quanto maior, mais Pokémon raros aparecem. |
| **Pesquisa do Sono** | **Momento do Intervalo / Descompressão** | Ao fim da sessão de estudos, você entra na tela de intervalo e vê os Pokémon que vieram estudar e descansaram com você. |
| **Poké Biscuits** | **Study Biscuits / Coffee Snacks** | Biscoitos ganhos ao bater metas de estudo. Usados para alimentar e recrutar Pokémon. |
| **Equipe da Ilha** | **Grupo de Estudos (Study Buddies)** | 5 Pokémon ativos na sua mesa que fornecem bônus passivos para as suas próximas sessões. |
| **Sleep Dex (Registro)** | **Focus Dex (Registro de Poses)** | Álbum que cataloga cada estilo de descanso descoberto (normal, fêmea, shiny, eventos). |

---

## 3. Loop Central de Gameplay (Passo a Passo)

```
[1. Definir Matéria/Meta] 
        ↓
[2. Iniciar Sessão Pomodoro] (Sem distrações no celular)
        ↓
[3. Finalizar Estudo] → Converte tempo em "Focus Power" & Moedas de Estudo
        ↓
[4. Coffee Break / Hora do Lanche] → Alimentar Pokémon que apareceram descansando
        ↓
[5. Recrutamento] → Encher a barra de amizade e adicionar ao Grupo de Estudos
        ↓
[6. Montar Equipe & Aproveitar Bônus] → Mais incentivo para a próxima sessão
```

---

## 4. Detalhamento das Mecânicas

### 4.1. A Sessão de Estudo (Pomodoro)
- O usuário escolhe a **matéria** que está estudando (ex: Matemática, Direito Constitucional, Inglês, Programação).
- Configura o timer:
  - **Pomodoro Clássico:** 25 min de foco + 5 min de pausa.
  - **Pomodoro Extendido:** 50 min de foco + 10 min de pausa.
  - **Timer Livre (Stopwatch):** Para quem estuda blocos longos sem pausas fixas.
- **Tela de Foco:** Visual aconchegante com seu Pokémon parceiro estudando numa mesinha ao som de música lo-fi ou ruído branco.

#### 4.1.1. Anti-Cheat & Modo "Deep Focus"
Em aplicativos gamificados de foco, o maior desafio é evitar distrações em redes sociais sem transformar o app em uma experiência punitiva e frustrante. No Pokémoro adotamos a filosofia de **incentivo positivo**:

- **Bônus de Tela Focada / Deep Focus (Multiplicador 1.2x):**
  - No mobile (React Native/Expo), monitora-se o `AppState`. Na web, a `Page Visibility API` (`document.visibilityState`).
  - Se o usuário mantiver o app em primeiro plano ou a tela desligada/bloqueada sem alternar para outros apps durante o Pomodoro, ganha o multiplicador **Deep Focus (1.2x Focus Power)**.
- **Tolerância Confortável (Grace Period de 60 segundos):**
  - Se o usuário precisar responder a uma mensagem rápida ou atender a uma ligação urgente, o app concede 1 minuto de tolerância.
  - Se ultrapassar 1 minuto fora do app, o bônus de *Deep Focus* é desativado para aquela sessão e o Pokémon parceiro na tela de foco assume uma animação de "distraído", voltando ao multiplicador normal (1.0x).
- **Penalidade Gentil (Não Punitiva):**
  - Diferente de apps que "matam a árvore" e geram sentimento de culpa, se o estudante interromper o Pomodoro no meio (ex: precisou sair aos 18 min de 25):
    - **O tempo estudado NUNCA é perdido:** os 18 minutos são salvos no histórico e geram moedas proporcionais.
    - **Condição do Coffee Break:** O evento especial de aparição dos Pokémon descansando só é ativado ao concluir o ciclo completo planejado, incentivando a conclusão sem frustração.

---

### 4.2. O Fim da Sessão e a "Pesquisa de Foco" (Spawn Engine)
Ao concluir o tempo de estudo, o app calcula o **Focus Power** final:
$$\text{Focus Power} = \text{Minutos de Estudo} \times \text{Multiplicador de Streak} \times \text{Multiplicador Deep Focus}$$

#### 4.2.1. A Matemática do Sorteio (Spawn Engine)
Uma função pura em TypeScript/JavaScript calcula os Pokémon sorteados na tela de descanso:

| Faixa de Focus Power | Quantidade de Pokémon | Estilos de Pose Possíveis | Probabilidade Shiny |
| :--- | :---: | :--- | :---: |
| **Até 250 FP** (Pomodoro padrão de 25m) | **2 Pokémon** | Estilo 1 (Normal) | 1 / 450 (~0.22%) |
| **251 a 600 FP** (Pomodoro 50m ou Streak ativo) | **3 a 4 Pokémon** | Estilo 1 + chance de Estilo 2 | 1 / 250 (~0.40%) |
| **601+ FP** (Sessões longas ou Streak 7+ dias) | **5 Pokémon** | Estilos 1, 2 e chance de Estilo 3 | 1 / 100 (~1.00%) |

#### 4.2.2. Rolagem de "Faminto!" (*Hungry State*)
- Para cada Pokémon sorteado, há **15% de chance fixa** (`Math.random() < 0.15`) de ele acordar com a tag animada **"Faminto!"**.
- O primeiro biscoito dado a um Pokémon faminto rende **3x mais pontos de amizade** (um Biscoito Básico de 1 ponto concede 3 pontos imediatos), gerando momentos de grande empolgação.

#### 4.2.3. Especificação do Algoritmo (TypeScript):
```typescript
interface SpawnResult {
  pokemonId: number;
  sleepStyle: 1 | 2 | 3;
  isShiny: boolean;
  isHungry: boolean;
}

function calculateSpawns(focusPower: number, streakDays: number): SpawnResult[] {
  // 1. Define quantidade de Pokémon
  let spawnCount = 2;
  if (focusPower > 600) spawnCount = 5;
  else if (focusPower > 250) spawnCount = Math.floor(Math.random() * 2) + 3; // 3 ou 4

  // 2. Calcula taxa de Shiny com base na dedicação (Streak)
  const shinyRate = Math.min(0.01, 0.0022 + (streakDays * 0.001));

  const results: SpawnResult[] = [];
  for (let i = 0; i < spawnCount; i++) {
    // Sorteia estilo (poses raras desbloqueadas com alto FP)
    let style: 1 | 2 | 3 = 1;
    if (focusPower > 600 && Math.random() < 0.25) style = 3;
    else if (focusPower > 250 && Math.random() < 0.40) style = 2;

    results.push({
      pokemonId: getRandomPokemonId(),
      sleepStyle: style,
      isShiny: Math.random() < shinyRate,
      isHungry: Math.random() < 0.15 // 15% de chance de Faminto
    });
  }

  return results;
}
```

---

### 4.3. Hora do Lanche (Snack Time & Amizade)
Ao clicar em um Pokémon que está descansando:
- Abre a tela de amizade com uma barra de corações (ex: 5 corações para Pokémon básicos, 10+ para evoluídos).
- O jogador usa biscoitos que ganha cumprindo metas diárias:
  - **Biscoito de Café (Básico):** Dá 1 ponto de amizade.
  - **Biscoito Especial (Great):** Dá 3 pontos de amizade.
  - **Biscoito Dourado (Master):** Enche a barra inteira na hora (recompensa por metas difíceis, como bater 50 horas de estudo no mês).
- **Mecânica de Saciado (*Full*):** O Pokémon pode ficar satisfeito antes de completar a barra. Mas não tem problema: **a amizade não zera!** No próximo dia que ele aparecer, o progresso continuará de onde parou.
- **Estado Concentrado / Faminto (*Hungry*):** Ocasionalmente um Pokémon aparece faminto, fazendo com que o primeiro biscoito triplique os pontos de amizade.

---

### 4.4. O Grupo de Estudos (Bônus Passivos)
Os Pokémon recrutados passam a fazer parte da sua equipe:
- **Especialistas em Energia:** Reduzem a perda de energia do jogador ou aumentam o descanso nas pausas.
- **Especialistas em Itens:** Coletam "Cafés", "Biscoitos" e "Moedas de Foco" enquanto você estuda.
- **Especialistas em Matérias:**
  - *Tipo Psíquico / Elétrico:* Bônus de XP para matérias exatas e programação.
  - *Tipo Fogo / Lutador:* Bônus de motivação para sessões longas e madrugadas.
  - *Tipo Planta / Água:* Aumentam a retenção e reduzem o cansaço mental.

---

## 5. Sistema de Recompensas e Gamificação

### 5.1. Ofensiva Diária (Streak)
- Estudar pelo menos 1 Pomodoro por dia mantém o fogo da ofensiva aceso.
- Manter o streak dá multiplicadores de Focus Power e aumenta a chance de encontrar **Pokémon Shiny** descansando.

### 5.2. Pokedex de Estudos (Focus Dex)
- **Menu Sprites (`sprites/menu/`):** Usados no perfil, na seleção da equipe e nos resumos da Pokedex.
- **Sleep Sprites (`sprites/sleep/`):** Usados nas telas de descanso pós-estudo e no álbum de poses conquistadas.
- **Shiny & Variantes:** Aquele prazer de encontrar um Pokémon com cor rara após uma semana inteira de estudos dedicados.

### 5.3. Relatórios e Estatísticas de Estudo
- Gráficos semanais e mensais de horas estudadas por matéria.
- Comparativo: "Você estudou tanto essa semana que alimentou 12 Pokémon e chocou 1 ovo!".

---

## 6. Proposta de Arquitetura Técnica para o App

- **Frontend:** React / Vite (Web ou PWA para rodar no PC e no celular) ou React Native / Flutter (Mobile).
- **Banco de Dados Local:** SQLite / IndexedDB (permite usar o app 100% offline, fundamental para quem estuda em locais sem internet ou com celular no modo avião).
- **Estrutura de Assets:**
  - `assets/`: Cenários de descanso em PNG top-down (`cenario_pokemon_sleep_9_16.png`, `cenario_praia_ciano.png`, `cenario_tundra_neve.png`, `cenario_caverna_taupe.png`, `cenario_sala_estudos.png`).
  - `sprites/menu/regular/`: Ícones dos Pokémon.
  - `sprites/menu/shiny/`: Ícones das versões brilhantes.
  - `sprites/sleep/regular/`: Poses de descanso após o estudo.
  - `sprites/sleep/shiny/`: Poses de descanso das versões shiny.
  - `sprites/menu/events/` & `sprites/sleep/events/`: Eventos sazonais no app.

---

## 7. Próximos Passos Sugeridos

1. **Definir a plataforma:** Será um Web App (navegador), Desktop (Electron) ou Mobile (App no celular)?
2. **Definir o protótipo inicial (MVP):**
   - Tela com Timer Pomodoro funcional.
   - Cálculo de Focus Power ao terminar o timer.
   - Tela de recompensa sorteando 2 a 3 Pokémon dormindo na tela.
   - Sistema de dar biscoito para subir a barra de amizade.
   - Galeria/Pokedex salvando os Pokémon recrutados.
