let map;
let directionsService;
let directionsRenderer;

// Coordenadas centrais aproximadas de Várzea Alegre - CE para viabilizar busca rápida e precisa
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

    // Definindo limites geográficos restritos ao Brasil e viés para Várzea Alegre/CE
    const options = {
        componentRestrictions: { country: "br" },
        // Cria uma caixa delimitadora ao redor de Várzea Alegre para priorizar sugestões locais
        bounds: new google.maps.LatLngBounds(
            { lat: -6.9000, lng: -39.4000 },
            { lat: -6.6500, lng: -39.1500 }
        ),
        strictBounds: false
    };

    const autocompleteOrigem = new google.maps.places.Autocomplete(origemInput, options);
    const autocompleteDestino = new google.maps.places.Autocomplete(destinoInput, options);

    // Se o campo de origem estiver vazio ao carregar, sugere automaticamente Várzea Alegre - CE
    if (!origemInput.value) {
        origemInput.value = "Várzea Alegre - CE";
    }
}

// Variáveis globais para guardar o último cálculo e enviar ao WhatsApp
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

            // Novas regras de preço solicitadas:
            // Até 30 km = R$ 15,00/km (Urbano) | Fora da cidade (> 30 km) = R$ 10,00/km
            let valorPorKm = distanciaKm <= 30 ? 15.00 : 10.00;
            ultimoTipoRota = distanciaKm <= 30 ? "Urbano (Várzea Alegre / Cidade)" : "Fora da cidade / Viagem";

            // Fator multiplicador de acordo com o tipo de carga
            let multiplicadorCarga = 1.0;
            if (tipoCarga.includes("Pequena")) multiplicadorCarga = 0.8;
            if (tipoCarga.includes("Grande")) multiplicadorCarga = 1.3;

            // Custo dos ajudantes (R$ 25,00 cada)
            const custoAjudantes = numAjudantes * 25.00;
            qtdAjudantesTexto = numAjudantes === 0 ? "Sem ajudantes (Morador carrega)" : `${numAjudantes} Ajudante(s) (R$ ${custoAjudantes.toFixed(2)})`;

            // Cálculo base por km + carga + ajudantes
            let valorTotal = ((distanciaKm * valorPorKm) * multiplicadorCarga) + custoAjudantes;

            // Novo valor mínimo do frete: R$ 39,90
            if (valorTotal < 39.90) {
                valorTotal = 39.90 + custoAjudantes; // garante o mínimo da viagem + ajudantes se houver
            }

            ultimoValorFrete = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            // Exibe na tela
            document.getElementById("distancia").innerText = ultimaDistancia;
            document.getElementById("tipoRota").innerText = ultimoTipoRota;
            document.getElementById("resAjudantes").innerText = qtdAjudantesTexto;
            document.getElementById("valorFrete").innerText = ultimoValorFrete;
            document.getElementById("resultado").classList.remove("hidden");
        } else {
            alert("Não foi possível calcular a rota. Verifique se os endereços existem ou tente especificar o bairro/cidade.");
        }
    });
});

// Ação do botão de WhatsApp para o número 88993082035 (DDI 55 + DDD 88 + 993082035)
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
