let map;
let directionsService;
let directionsRenderer;

// Coordenadas centrais aproximadas de Várzea Alegre - CE
const VARZEA_ALEGRE_LATLNG = { lat: -6.7943, lng: -39.2982 };

function initMap() {
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: VARZEA_ALEGRE_LATLNG,
    });

    directionsRenderer.setMap(map);

    const origemInput = document.getElementById("origem");
    const destinoInput = document.getElementById("destino");

    const options = {
        componentRestrictions: { country: "br" },
        bounds: new google.maps.LatLngBounds(
            { lat: -6.9000, lng: -39.4000 },
            { lat: -6.6500, lng: -39.1500 }
        ),
        strictBounds: false
    };

    new google.maps.places.Autocomplete(origemInput, options);
    new google.maps.places.Autocomplete(destinoInput, options);

    if (!origemInput.value) {
        origemInput.value = "Várzea Alegre - CE";
    }
}

let ultimaDistancia = "";
let ultimoTipoRota = "";
let ultimoValorFrete = "";
let qtdAjudantesTexto = "";

document.getElementById("calcularBtn").addEventListener("click", () => {
    const origem = document.getElementById("origem").value;
    const destino = document.getElementById("destino").value;
    const tipoCarga = document.getElementById("tipoCarga").value;
    const numAjudantes = parseInt(document.getElementById("ajudantes").value) || 0;

    if (!origem || !destino) {
        alert("Por favor, preencha os endereços de partida e chegada.");
        return;
    }

    const request = {
        origin: origem,
        destination: destino,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
        if (status === "OK") {
            directionsRenderer.setDirections(result);

            const distanciaMetros = result.routes[0].legs[0].distance.value;
            const distanciaKm = distanciaMetros / 1000;
            ultimaDistancia = result.routes[0].legs[0].distance.text;

            // 1. Taxa mínima base obrigatória
            let taxaMinimaBase = 39.90;

            // 2. Cálculo por distância fora do perímetro urbano (rotas acima de 15 km)
            let custoKmFora = 0;
            if (distanciaKm > 15) {
                custoKmFora = distanciaKm * 6.67; // R$ 6,67 por km rodado
                ultimoTipoRota = "Fora da cidade / Intermunicipal";
            } else {
                ultimoTipoRota = "Urbano (Dentro de Várzea Alegre)";
            }

            // 3. Adicional de ajudantes (R$ 25,00 por ajudante)
            const custoAjudantes = numAjudantes * 25.00;
            qtdAjudantesTexto = numAjudantes === 0 
                ? "Sem ajudantes (Morador carrega)" 
                : `${numAjudantes} Ajudante(s) (+ R$ ${custoAjudantes.toFixed(2)})`;

            // VALOR TOTAL = Taxa Mínima (39,90) + (Km fora x R$ 6,67) + Ajudantes
            let valorTotal = taxaMinimaBase + custoKmFora + custoAjudantes;

            ultimoValorFrete = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            // Exibe na tela
            document.getElementById("distancia").innerText = ultimaDistancia;
            document.getElementById("tipoRota").innerText = ultimoTipoRota;
            document.getElementById("resAjudantes").innerText = qtdAjudantesTexto;
            document.getElementById("valorFrete").innerText = ultimoValorFrete;
            document.getElementById("resultado").classList.remove("hidden");
        } else {
            alert("Não foi possível calcular a rota. Verifique os endereços digitados.");
        }
    });
});

// Envio para o WhatsApp
document.getElementById("whatsappBtn").addEventListener("click", () => {
    const origem = document.getElementById("origem").value;
    const destino = document.getElementById("destino").value;
    const tipoCarga = document.getElementById("tipoCarga").value;
    const dataFrete = document.getElementById("dataFrete").value || "Não informada";
    const horaFrete = document.getElementById("horaFrete").value || "Não informado";

    let dataFormatada = dataFrete;
    if (dataFrete.includes("-")) {
        const partes = dataFrete.split("-");
        dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    const mensagem = 
        `🚚 *SOLICITAÇÃO DE FRETE - FRETEFÁCIL* 🚚\n\n` +
        `📍 *Origem:* ${origem}\n` +
        `🎯 *Destino:* ${destino}\n` +
        `📦 *Carga:* ${tipoCarga}\n` +
        `👥 *Ajudantes:* ${qtdAjudantesTexto}\n` +
        `📅 *Data:* ${dataFormatada}\n` +
        `⏰ *Horário:* ${horaFrete}\n` +
        `📏 *Distância:* ${ultimaDistancia}\n` +
        `💰 *Valor Total:* ${ultimoValorFrete}\n\n` +
        `Olá! Gostaria de confirmar este orçamento.`;

    const telefone = "5588993082035";
    const urlWhatsapp = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`;
    
    window.open(urlWhatsapp, '_blank');
});

window.onload = initMap;
