import os
import shutil
import requests
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SPRITES_DIR = os.path.join(BASE_DIR, "sprites")

def classificar_variante(nome_arquivo):
    """
    Classifica o arquivo em:
    - 'events': variações de evento (halloween, holiday, captain, etc.)
    - 'shiny': versões shiny (terminam com _s ou contêm _s_)
    - 'regular': versões normais (incluindo variações de gênero como _f)
    """
    nome_sem_ext = os.path.splitext(nome_arquivo)[0].lower()
    if any(keyword in nome_sem_ext for keyword in ["halloween", "holiday", "captain"]):
        return "events"
    elif nome_sem_ext.endswith("_s") or "_s_" in nome_sem_ext:
        return "shiny"
    else:
        return "regular"

def organizar_pasta_antiga(pasta_antiga_nome="sprites_pokemon"):
    """
    Organiza arquivos já baixados na pasta antiga para a nova estrutura sprites/menu/
    """
    pasta_antiga = os.path.join(BASE_DIR, pasta_antiga_nome)
    if not os.path.exists(pasta_antiga):
        return

    arquivos = [f for f in os.listdir(pasta_antiga) if os.path.isfile(os.path.join(pasta_antiga, f))]
    if not arquivos:
        return

    print(f"\nOrganizando {len(arquivos)} arquivos existentes de '{pasta_antiga_nome}' para 'sprites/menu/'...")

    for f in arquivos:
        variante = classificar_variante(f)
        destino_dir = os.path.join(SPRITES_DIR, "menu", variante)
        os.makedirs(destino_dir, exist_ok=True)
        
        origem = os.path.join(pasta_antiga, f)
        destino = os.path.join(destino_dir, f)
        
        if not os.path.exists(destino):
            shutil.move(origem, destino)
        else:
            os.remove(origem)

    # Remove a pasta antiga se ficou vazia
    try:
        os.rmdir(pasta_antiga)
    except OSError:
        pass

    print("Arquivos existentes organizados com sucesso!")

def baixar_e_organizar(categoria_nome, tipo_sprite):
    """
    Baixa todas as imagens de uma categoria e as organiza em:
    sprites/{tipo_sprite}/regular/
    sprites/{tipo_sprite}/shiny/
    sprites/{tipo_sprite}/events/
    """
    session = requests.Session()
    session.headers.update({"User-Agent": "PokemonSleepAppAssetFetcher/1.0"})

    url = "https://archives.bulbagarden.net/w/api.php"

    params = {
        "action": "query",
        "generator": "categorymembers",
        "gcmtitle": categoria_nome,
        "gcmtype": "file",
        "gcmlimit": 500,
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json",
    }

    print(f"\n==========================================")
    print(f"Categoria: {categoria_nome}")
    print(f"Destino base: sprites/{tipo_sprite}/")
    print(f"==========================================")

    pagina = 1
    total_baixados = 0
    total_pulados = 0

    while True:
        print(f"\n--- Consultando página {pagina} ---")
        try:
            res = session.get(url, params=params, timeout=30).json()
        except Exception as e:
            print(f"Erro ao consultar a API da Wiki: {e}")
            break

        paginas = res.get("query", {}).get("pages", {})

        for page_id, page_data in paginas.items():
            image_info = page_data.get("imageinfo", [])
            if not image_info:
                continue

            titulo_arquivo = page_data.get("title", "")
            img_url = image_info[0]["url"]

            # Limpa o título do arquivo
            # Remove "File:Sleep Style ", "File:Sleep Menu ", "File:Sleep "
            nome_limpo = (
                titulo_arquivo.replace("File:Sleep Style ", "")
                .replace("File:Sleep Menu ", "")
                .replace("File:Sleep ", "")
                .replace(" ", "_")
            )
            if nome_limpo.startswith("Style_"):
                nome_limpo = nome_limpo[len("Style_") :]
            if nome_limpo.startswith("Menu_"):
                nome_limpo = nome_limpo[len("Menu_") :]

            # Ignora estilo 4 de sono (Atop-Belly Sleep / dormindo sobre a barriga do Snorlax)
            if tipo_sprite == "sleep" and re.search(r"-4(_|\.|$)", nome_limpo):
                continue

            # Classifica para a subpasta correta: regular, shiny ou events
            variante = classificar_variante(nome_limpo)
            pasta_destino = os.path.join(SPRITES_DIR, tipo_sprite, variante)
            os.makedirs(pasta_destino, exist_ok=True)

            caminho_arquivo = os.path.join(pasta_destino, nome_limpo)

            # Pula se o arquivo já existir e não estiver vazio
            if os.path.exists(caminho_arquivo) and os.path.getsize(caminho_arquivo) > 0:
                total_pulados += 1
                continue

            # Faz o download
            try:
                img_data = session.get(img_url, timeout=30).content
                with open(caminho_arquivo, "wb") as f:
                    f.write(img_data)
                total_baixados += 1
                print(f"[{tipo_sprite}/{variante}] Baixado: {nome_limpo}")
            except Exception as e:
                print(f"Erro ao baixar {nome_limpo}: {e}")

        # Paginação com 'continue'
        if "continue" in res:
            params.update(res["continue"])
            pagina += 1
        else:
            print(f"\nFinalizado {tipo_sprite}!")
            print(f"Baixados: {total_baixados} | Já existentes: {total_pulados}")
            break

if __name__ == "__main__":
    # 1. Se houver arquivos na pasta antiga (sprites_pokemon ou sprites_sleep), move para sprites/menu/
    organizar_pasta_antiga("sprites_pokemon")
    organizar_pasta_antiga("sprites_sleep")

    # 2. Baixar e organizar os sprites dos Pokémon dormindo (Sleep style sprites)
    baixar_e_organizar(
        categoria_nome="Category:Pokémon Sleep sleep style sprites",
        tipo_sprite="sleep"
    )
