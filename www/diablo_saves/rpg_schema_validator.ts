/**
 * rpg_schema_validator.ts
 *
 * Módulo TypeScript altamente otimizado para o ecossistema Danger Ghost.
 * Implementa validação estrutural rígida, verificação de tipos e salvaguardas anti-cheat
 * para o estado de salvamento (Save State) do jogador local, espelhando e validando as
 * regras do arquivo 'save_state_template.json'.
 *
 * Idioma: Português
 */

// --- Interfaces de Tipos e Estrutura ---

export type ItemQuality = 'Comum' | 'Magico' | 'Raro' | 'Unico';
export type ItemSlot = 'Head' | 'Chest' | 'MainHand' | 'OffHand' | 'Ring' | 'Amulet';

export interface ItemRequirements {
  forca: number;
  destreza: number;
  inteligencia: number;
}

export interface RPGItem {
  id: string;
  nome: string;
  qualidade: ItemQuality;
  slot: ItemSlot;
  nivel_item: number;
  dano_base?: number;
  defesa_base?: number;
  atributos_adicionais?: Record<string, number>;
  requisitos?: ItemRequirements;
}

export interface StashItem extends RPGItem {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

export type SkillName = 'ghost_walk' | 'blood_rite' | 'soul_rend' | 'shadow_step' | 'iron_will' | 'death_mark';

export interface AllocatedSkill {
  id_habilidade: SkillName;
  pontos: number;
}

export interface CharacterAttributes {
  forca: number;
  destreza: number;
  inteligencia: number;
  vitalidade: number;
}

export interface MapCoordinates {
  mapa_id: string;
  x: number;
  y: number;
}

export interface ActiveEquipment {
  cabeca: RPGItem | null;
  peitoral: RPGItem | null;
  mao_principal: RPGItem | null;
  mao_secundaria: RPGItem | null;
  anel_1: RPGItem | null;
  anel_2: RPGItem | null;
  amuleto: RPGItem | null;
}

export interface RPGCharacterState {
  id_jogador: string;
  nivel: number;
  pontos_experiencia: number;
  atributos: CharacterAttributes;
  habilidades_alocadas: AllocatedSkill[];
  coordenadas_mapa: MapCoordinates;
  equipamento_ativo: ActiveEquipment;
  lista_bau_stash: StashItem[];
}

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  data?: RPGCharacterState;
}

// --- Validador Principal ---

export class RPGSchemaValidator {
  private static readonly UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  private static readonly STASH_GRID_WIDTH = 10;
  private static readonly STASH_GRID_HEIGHT = 8;

  /**
   * Executa a análise (parse) e validação profunda de integridade do Save State.
   * 
   * @param rawState Entrada contendo a string JSON do save ou um objeto já interpretado.
   * @returns ValidationResult contendo o status, mensagens de erro/aviso e os dados validados.
   */
  public static validate(rawState: string | any): ValidationResult {
    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: []
    };

    let state: any;

    // 1. Tentar ler e fazer parse do JSON caso seja string
    if (typeof rawState === 'string') {
      try {
        state = JSON.parse(rawState);
      } catch (err: any) {
        result.success = false;
        result.errors.push(`Erro de sintaxe JSON: ${err.message}`);
        return result;
      }
    } else if (rawState && typeof rawState === 'object') {
      state = rawState;
    } else {
      result.success = false;
      result.errors.push('O estado fornecido é nulo ou não é um objeto válido.');
      return result;
    }

    // 2. Validação de Estrutura Inicial e Propriedades Requeridas
    const requiredTopFields = [
      'id_jogador',
      'nivel',
      'pontos_experiencia',
      'atributos',
      'habilidades_alocadas',
      'coordenadas_mapa',
      'equipamento_ativo',
      'lista_bau_stash'
    ];

    for (const field of requiredTopFields) {
      if (state[field] === undefined) {
        result.success = false;
        result.errors.push(`Propriedade requerida ausente na raiz do save: '${field}'`);
      }
    }

    if (!result.success) return result;

    // 3. Validação do Campo id_jogador (UUID v4)
    if (typeof state.id_jogador !== 'string' || !this.UUID_REGEX.test(state.id_jogador)) {
      result.success = false;
      result.errors.push(`Formato inválido para 'id_jogador'. Deve ser um UUID v4 válido.`);
    }

    // 4. Validação do Nível (1 a 99)
    if (typeof state.nivel !== 'number' || !Number.isInteger(state.nivel) || state.nivel < 1 || state.nivel > 99) {
      result.success = false;
      result.errors.push(`Valor inválido para 'nivel' (${state.nivel}). Deve ser um inteiro de 1 a 99.`);
    }

    // 5. Validação de Experiência
    if (typeof state.pontos_experiencia !== 'number' || !Number.isInteger(state.pontos_experiencia) || state.pontos_experiencia < 0) {
      result.success = false;
      result.errors.push(`Pontos de experiência inválidos. Devem ser maiores ou iguais a 0.`);
    }

    // 6. Validação de Atributos Primários
    const attr = state.atributos;
    if (typeof attr !== 'object' || attr === null) {
      result.success = false;
      result.errors.push(`'atributos' deve ser um objeto válido contendo forca, destreza, inteligencia e vitalidade.`);
    } else {
      const requiredAttrs = ['forca', 'destreza', 'inteligencia', 'vitalidade'];
      for (const a of requiredAttrs) {
        if (typeof attr[a] !== 'number' || !Number.isInteger(attr[a]) || attr[a] < 0) {
          result.success = false;
          result.errors.push(`Atributo '${a}' inválido (${attr[a]}). Deve ser um inteiro maior ou igual a 0.`);
        }
      }
    }

    // 7. Validação de Árvore de Habilidades
    const skills = state.habilidades_alocadas;
    if (!Array.isArray(skills)) {
      result.success = false;
      result.errors.push(`'habilidades_alocadas' deve ser uma lista (array).`);
    } else {
      let totalSkillPointsAllocated = 0;
      const validSkillNames = new Set(['ghost_walk', 'blood_rite', 'soul_rend', 'shadow_step', 'iron_will', 'death_mark']);

      for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        if (typeof skill !== 'object' || skill === null) {
          result.success = false;
          result.errors.push(`Habilidade no índice ${i} não é um objeto válido.`);
          continue;
        }

        if (!validSkillNames.has(skill.id_habilidade)) {
          result.success = false;
          result.errors.push(`Habilidade inválida '${skill.id_habilidade}' no índice ${i}. Nós válidos: [${Array.from(validSkillNames).join(', ')}]`);
        }

        if (typeof skill.pontos !== 'number' || !Number.isInteger(skill.pontos) || skill.pontos < 1 || skill.pontos > 20) {
          result.success = false;
          result.errors.push(`Pontos de habilidade inválidos para '${skill.id_habilidade}'. Deve ser um inteiro entre 1 e 20.`);
        } else {
          totalSkillPointsAllocated += skill.pontos;
        }
      }

      // Validação Anti-Cheat: Limite de pontos alocados baseado no nível
      // O jogador não pode ter mais pontos do que seu nível permite (geralmente nível - 1 mais alguns pontos extras de quests, definiremos o teto como nivel + 5)
      if (result.success && totalSkillPointsAllocated > (state.nivel + 5)) {
        result.success = false;
        result.errors.push(`Anti-Cheat: O jogador alocou um total de ${totalSkillPointsAllocated} pontos de habilidade, excedendo o teto lógico máximo de ${state.nivel + 5} pontos para o nível ${state.nivel}.`);
      }
    }

    // 8. Validação de Coordenadas de Mapa
    const coords = state.coordenadas_mapa;
    if (typeof coords !== 'object' || coords === null) {
      result.success = false;
      result.errors.push(`'coordenadas_mapa' deve ser um objeto válido.`);
    } else {
      if (typeof coords.mapa_id !== 'string' || coords.mapa_id.trim() === '') {
        result.success = false;
        result.errors.push(`'mapa_id' nas coordenadas de mapa deve ser um texto descritivo não-vazio.`);
      }
      if (typeof coords.x !== 'number' || isNaN(coords.x) || typeof coords.y !== 'number' || isNaN(coords.y)) {
        result.success = false;
        result.errors.push(`As coordenadas 'x' e 'y' do mapa devem ser valores numéricos válidos.`);
      }
    }

    // 9. Validação do Equipamento Ativo
    const eq = state.equipamento_ativo;
    if (typeof eq !== 'object' || eq === null) {
      result.success = false;
      result.errors.push(`'equipamento_ativo' deve ser um objeto válido contendo os slots do herói.`);
    } else {
      const slotsValidos = ['cabeca', 'peitoral', 'mao_principal', 'mao_secundaria', 'anel_1', 'anel_2', 'amuleto'];
      for (const slotKey of slotsValidos) {
        if (eq[slotKey] === undefined) {
          result.success = false;
          result.errors.push(`Slot de equipamento '${slotKey}' ausente em 'equipamento_ativo'.`);
        } else if (eq[slotKey] !== null) {
          // Validar a estrutura do item equipado
          const itemVal = eq[slotKey];
          const errorPrefix = `Slot de Equipamento '${slotKey}' -> Item '${itemVal?.nome || 'Desconhecido'}':`;
          this.validateItemStructure(itemVal, errorPrefix, result);

          // Validação Anti-Cheat: Verificar se o item de fato pertence ao slot equipado
          if (result.success && itemVal) {
            const matchSlot = this.isSlotCompatible(slotKey, itemVal.slot);
            if (!matchSlot) {
              result.success = false;
              result.errors.push(`Anti-Cheat: O item '${itemVal.nome}' do tipo '${itemVal.slot}' foi equipado incorretamente no slot físico '${slotKey}'.`);
            }

            // Validação de Atributos Necessários para Equipar
            if (itemVal.requisitos) {
              const req = itemVal.requisitos;
              const pStr = attr.forca;
              const pDex = attr.destreza;
              const pInt = attr.inteligencia;

              if (pStr < req.forca || pDex < req.destreza || pInt < req.inteligencia) {
                result.warnings.push(
                  `Requisito Não Atendido: O herói equipou '${itemVal.nome}', mas não atende aos atributos exigidos (Requer: F:${req.forca}, D:${req.destreza}, I:${req.inteligencia} | Herói possui: F:${pStr}, D:${pDex}, I:${pInt}).`
                );
              }
            }
          }
        }
      }
    }

    // 10. Validação do Baú Stash Grid-based (10x8)
    const stashList = state.lista_bau_stash;
    if (!Array.isArray(stashList)) {
      result.success = false;
      result.errors.push(`'lista_bau_stash' deve ser uma lista (array) de itens.`);
    } else {
      // Matriz bidimensional de colisão (10 largura x 8 altura)
      // Cada slot guarda o string ID do item que o ocupa, ou "" se estiver vazio.
      const collisionGrid: string[][] = Array.from(
        { length: this.STASH_GRID_HEIGHT },
        () => Array(this.STASH_GRID_WIDTH).fill('')
      );

      for (let i = 0; i < stashList.length; i++) {
        const item = stashList[i];
        const errPref = `Baú Stash (Item #${i} - '${item?.nome || 'Desconhecido'}'):`;

        // Validar campos estruturais do item
        this.validateItemStructure(item, errPref, result);

        // Validar dimensões físicas e coordenadas de grade
        if (typeof item.x !== 'number' || !Number.isInteger(item.x) || item.x < 0 || item.x >= this.STASH_GRID_WIDTH) {
          result.success = false;
          result.errors.push(`${errPref} Coordenada X (${item.x}) fora dos limites da grade do baú (0 a 9).`);
        }
        if (typeof item.y !== 'number' || !Number.isInteger(item.y) || item.y < 0 || item.y >= this.STASH_GRID_HEIGHT) {
          result.success = false;
          result.errors.push(`${errPref} Coordenada Y (${item.y}) fora dos limites da grade do baú (0 a 7).`);
        }
        if (typeof item.largura !== 'number' || !Number.isInteger(item.largura) || item.largura < 1 || item.largura > 2) {
          result.success = false;
          result.errors.push(`${errPref} Largura inválida (${item.largura}). Deve ser 1 ou 2 slots.`);
        }
        if (typeof item.altura !== 'number' || !Number.isInteger(item.altura) || item.altura < 1 || item.altura > 4) {
          result.success = false;
          result.errors.push(`${errPref} Altura inválida (${item.altura}). Deve ser de 1 a 4 slots.`);
        }

        if (!result.success) continue;

        // Validar se o item estrapola a largura/altura máxima da grade
        if (item.x + item.largura > this.STASH_GRID_WIDTH) {
          result.success = false;
          result.errors.push(`${errPref} Item excede a largura máxima do baú pelo lado direito.`);
        }
        if (item.y + item.altura > this.STASH_GRID_HEIGHT) {
          result.success = false;
          result.errors.push(`${errPref} Item excede a altura máxima do baú pelo fundo.`);
        }

        if (!result.success) continue;

        // Detecção de Colisão Física na Grade do Baú (Anti-Overlap Cheat)
        for (let row = item.y; row < item.y + item.altura; row++) {
          for (let col = item.x; col < item.x + item.largura; col++) {
            const cellVal = collisionGrid[row][col];
            if (cellVal !== '') {
              result.success = false;
              result.errors.push(
                `Anti-Cheat: Colisão de Inventário física no Baú! O item '${item.nome}' (ID: ${item.id}) sobrepõe-se ao item de ID '${cellVal}' nas coordenadas (${col}, ${row}).`
              );
            } else {
              collisionGrid[row][col] = item.id;
            }
          }
        }
      }
    }

    if (result.success) {
      result.data = state as RPGCharacterState;
    }

    return result;
  }

  /**
   * Valida a integridade estrutural de um único item (qualidade, slot, atributos, etc.)
   */
  private static validateItemStructure(item: any, prefix: string, result: ValidationResult): void {
    if (typeof item !== 'object' || item === null) {
      result.success = false;
      result.errors.push(`${prefix} O item não é um objeto válido.`);
      return;
    }

    // Campos requeridos
    const reqItemFields = ['id', 'nome', 'qualidade', 'slot', 'nivel_item'];
    for (const f of reqItemFields) {
      if (item[f] === undefined) {
        result.success = false;
        result.errors.push(`${prefix} Propriedade do item '${f}' ausente.`);
      }
    }

    if (!result.success) return;

    // Verificar ID (UUID)
    if (typeof item.id !== 'string' || !this.UUID_REGEX.test(item.id)) {
      result.success = false;
      result.errors.push(`${prefix} Identificador de item inválido. Deve ser um UUID v4 válido.`);
    }

    // Nome
    if (typeof item.nome !== 'string' || item.nome.trim() === '') {
      result.success = false;
      result.errors.push(`${prefix} O nome do item não pode ser vazio.`);
    }

    // Qualidade
    const qualidadesValidas = ['Comum', 'Magico', 'Raro', 'Unico'];
    if (!qualidadesValidas.includes(item.qualidade)) {
      result.success = false;
      result.errors.push(`${prefix} Qualidade do item inválida: '${item.qualidade}'. Esperado: [${qualidadesValidas.join(', ')}]`);
    }

    // Slot
    const slotsValidos = ['Head', 'Chest', 'MainHand', 'OffHand', 'Ring', 'Amulet'];
    if (!slotsValidos.includes(item.slot)) {
      result.success = false;
      result.errors.push(`${prefix} Tipo de slot inválido: '${item.slot}'. Esperado: [${slotsValidos.join(', ')}]`);
    }

    // Nível do item (iLvl)
    if (typeof item.nivel_item !== 'number' || !Number.isInteger(item.nivel_item) || item.nivel_item < 1 || item.nivel_item > 99) {
      result.success = false;
      result.errors.push(`${prefix} Nível de item inválido (${item.nivel_item}). Deve ser um inteiro de 1 a 99.`);
    }

    // Dano e Defesa Opcionais
    if (item.dano_base !== undefined && (typeof item.dano_base !== 'number' || item.dano_base < 0)) {
      result.success = false;
      result.errors.push(`${prefix} Dano base inválido. Deve ser um número maior ou igual a 0.`);
    }
    if (item.defesa_base !== undefined && (typeof item.defesa_base !== 'number' || item.defesa_base < 0)) {
      result.success = false;
      result.errors.push(`${prefix} Defesa base inválida. Deve ser um número maior ou igual a 0.`);
    }

    // Atributos adicionais
    if (item.atributos_adicionais !== undefined) {
      if (typeof item.atributos_adicionais !== 'object' || item.atributos_adicionais === null) {
        result.success = false;
        result.errors.push(`${prefix} 'atributos_adicionais' deve ser um objeto Record<string, number> válido.`);
      } else {
        for (const [key, value] of Object.entries(item.atributos_adicionais)) {
          if (typeof value !== 'number' || !Number.isInteger(value)) {
            result.success = false;
            result.errors.push(`${prefix} Bônus do afixo '${key}' inválido (${value}). Deve ser um inteiro.`);
          }
        }
      }
    }

    // Requisitos de atributos do item
    if (item.requisitos !== undefined) {
      const reqs = item.requisitos;
      if (typeof reqs !== 'object' || reqs === null) {
        result.success = false;
        result.errors.push(`${prefix} 'requisitos' deve ser um objeto de atributos válido.`);
      } else {
        const requiredReqs = ['forca', 'destreza', 'inteligencia'];
        for (const r of requiredReqs) {
          if (typeof reqs[r] !== 'number' || !Number.isInteger(reqs[r]) || reqs[r] < 0) {
            result.success = false;
            result.errors.push(`${prefix} Requisito '${r}' inválido. Deve ser um inteiro maior ou igual a 0.`);
          }
        }
      }
    }
  }

  /**
   * Determina a compatibilidade entre uma chave de slot de equipamento ativo do herói e o tipo de slot do item.
   */
  private static isSlotCompatible(equipSlot: string, itemSlot: string): boolean {
    switch (equipSlot) {
      case 'cabeca':
        return itemSlot === 'Head';
      case 'peitoral':
        return itemSlot === 'Chest';
      case 'mao_principal':
        return itemSlot === 'MainHand';
      case 'mao_secundaria':
        return itemSlot === 'OffHand';
      case 'anel_1':
      case 'anel_2':
        return itemSlot === 'Ring';
      case 'amuleto':
        return itemSlot === 'Amulet';
      default:
        return false;
    }
  }
}
