# -*- coding: utf-8 -*-
"""
Narração com o TEMPO DE CADA PALAVRA.

Por que existe, e por que não basta o `edge-tts` de linha de comando:

O CLI entrega o áudio e, no máximo, uma legenda por FRASE. Isso não serve para
o que quebrou: numa cena em que a voz lista sete itens de menu numa frase só, o
ponteiro precisa chegar em "Financeiro" no instante em que a palavra
"Financeiro" é dita. Com granularidade de frase, o melhor que dá para fazer é
dividir o tempo em partes iguais — e foi exatamente isso que produziu a
dessincronia que a Dani viu: *"o guia aponta para um lugar e a voz já está lá
na frente"*.

A API de streaming do edge-tts emite eventos `WordBoundary` com o deslocamento
de cada palavra. É o que este script extrai. O JSON de saída tem, por palavra,
o instante em segundos desde o começo da fala — e é isso que deixa o ponteiro
andar no compasso da voz, em vez de num cronômetro paralelo.

    python narrar.py <voz> <ritmo> <texto.txt> <saida.mp3> <saida.json>
"""
import asyncio
import json
import sys

import edge_tts


async def gerar(voz, ritmo, texto, saida_mp3, saida_json):
    # `boundary` é SentenceBoundary por PADRÃO nesta versão (7.2.8) — pedir
    # WordBoundary explicitamente é o que destrava o tempo palavra a palavra.
    com = edge_tts.Communicate(texto, voz, rate=ritmo, boundary="WordBoundary")
    palavras = []
    with open(saida_mp3, "wb") as f:
        async for parte in com.stream():
            if parte["type"] == "audio":
                f.write(parte["data"])
            elif parte["type"] == "WordBoundary":
                # offset e duration vêm em unidades de 100 nanossegundos
                palavras.append({
                    "texto": parte["text"],
                    "t": round(parte["offset"] / 10_000_000, 3),
                    "dur": round(parte["duration"] / 10_000_000, 3),
                })
    with open(saida_json, "w", encoding="utf-8") as f:
        json.dump(palavras, f, ensure_ascii=False)
    return len(palavras)


def main():
    if len(sys.argv) < 6:
        print(__doc__)
        return 1
    voz, ritmo, arq_texto, saida_mp3, saida_json = sys.argv[1:6]
    with open(arq_texto, encoding="utf-8") as f:
        texto = f.read()
    n = asyncio.run(gerar(voz, ritmo, texto, saida_mp3, saida_json))
    print(f"{n} palavras cronometradas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
