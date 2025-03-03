const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Conexão com o MongoDB
mongoose.connect("mongodb://localhost:27017/tList", {
 
})
.then(() => console.log("Conectado ao MongoDB"))
.catch(err => console.error("Erro ao conectar ao MongoDB:", err));

// Esquema para tarefas (o mesmo para todas as collections)
const tarefaSchema = new mongoose.Schema({
  descricao: String,
  concluida: {
    type: Boolean,
    default: false
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  }
});

// Modelo dinâmico para tarefas
const getTarefaModel = (collection) => {
  return mongoose.model(collection, tarefaSchema);
};

// Lista de cores pastel disponíveis
const coresPastel = [
  "#FFB6C1", 
  "#FFD700", 
  "#98FB98", 
  "#ADD8E6", 
  "#FFA07A", 
  "#DDA0DD", 
  "#87CEFA", 
  "#F0E68C", 
  "#E6E6FA", 
  "#B0E0E6", 
  "#FFDAB9", 
  "#D8BFD8"  
];

// Esquema para informações de collections
const collectionInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: function() {
      // Atribuir uma cor pastel aleatória por padrão
      return coresPastel[Math.floor(Math.random() * coresPastel.length)];
    }
  },
  resetDaily: {
    type: Boolean,
    default: false
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  }
});

// Modelo para informações de collections
const CollectionInfo = mongoose.model("CollectionInfo", collectionInfoSchema);

// Inicializar collections padrão se não existirem
async function initializeDefaultCollections() {
  const defaultCollections = [
    { name: "tdcs", displayName: "Casa", color: "#FFB6C1" }, // Rosa claro
    { name: "tdts", displayName: "Trabalho", color: "#87CEFA" }, // Azul céu claro
    { name: "tdfs", displayName: "Faculdade", color: "#98FB98" } // Verde claro
  ];
  
  for (const collection of defaultCollections) {
    const exists = await CollectionInfo.findOne({ name: collection.name });
    if (!exists) {
      await new CollectionInfo(collection).save();
      console.log(`Collection padrão criada: ${collection.name}`);
    }
  }
}

// Chamar a função de inicialização
initializeDefaultCollections().catch(err => {
  console.error("Erro ao inicializar collections padrão:", err);
});

// Rota para listar todas as collections disponíveis
app.get("/collections", async (req, res) => {
  try {
    const collectionsInfo = await CollectionInfo.find().sort({ dataCriacao: 1 });
    res.json({ 
      collections: collectionsInfo.map(col => col.name),
      collectionsInfo: collectionsInfo
    });
  } catch (error) {
    console.error("Erro ao listar collections:", error);
    res.status(500).json({ error: "Erro ao listar collections" });
  }
});

// Rota para obter informações completas de uma collection
app.get("/collections/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    const collectionInfo = await CollectionInfo.findOne({ name: collection });
    
    if (!collectionInfo) {
      return res.status(404).json({ error: "Collection não encontrada" });
    }
    
    res.json(collectionInfo);
  } catch (error) {
    console.error("Erro ao buscar informações da collection:", error);
    res.status(500).json({ error: "Erro ao buscar informações da collection" });
  }
});

// Rota para obter o nome de exibição de uma collection
app.get("/collections/:collection/name", async (req, res) => {
  try {
    const { collection } = req.params;
    const collectionInfo = await CollectionInfo.findOne({ name: collection });
    
    if (!collectionInfo) {
      return res.status(404).json({ error: "Collection não encontrada" });
    }
    
    res.json({ displayName: collectionInfo.displayName });
  } catch (error) {
    console.error("Erro ao buscar nome da collection:", error);
    res.status(500).json({ error: "Erro ao buscar nome da collection" });
  }
});

// Rota para criar uma nova collection
app.post("/collections", async (req, res) => {
  try {
    const { collectionName, displayName, color } = req.body;
    
    if (!collectionName || !displayName) {
      return res.status(400).json({ error: "Nome da collection e nome de exibição são obrigatórios" });
    }
    
    // Verificar se a collection já existe
    const exists = await CollectionInfo.findOne({ name: collectionName });
    if (exists) {
      return res.status(400).json({ error: "Collection já existe" });
    }
    
    // Criar nova entrada no modelo de informações de collections
    const newCollectionInfo = new CollectionInfo({
      name: collectionName,
      displayName: displayName,
      color: color || undefined // Usa a cor padrão se não for fornecida
    });
    
    await newCollectionInfo.save();
    
    res.status(201).json({
      message: "Collection criada com sucesso",
      collection: newCollectionInfo
    });
  } catch (error) {
    console.error("Erro ao criar collection:", error);
    res.status(500).json({ error: "Erro ao criar collection" });
  }
});

// Rota para atualizar informações da collection (cor)
app.patch("/collections/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    const { color, displayName, resetDaily } = req.body;
    
    const updateData = {};
    if (color) updateData.color = color;
    if (displayName) updateData.displayName = displayName;
    if (resetDaily !== undefined) updateData.resetDaily = resetDaily;
    
    const collectionInfo = await CollectionInfo.findOneAndUpdate(
      { name: collection },
      updateData,
      { new: true }
    );
    
    if (!collectionInfo) {
      return res.status(404).json({ error: "Collection não encontrada" });
    }
    
    res.json(collectionInfo);
  } catch (error) {
    console.error("Erro ao atualizar collection:", error);
    res.status(500).json({ error: "Erro ao atualizar collection" });
  }
});

// Rota para excluir uma collection
app.delete("/collections/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    
    // Verificar se a collection existe
    const collectionInfo = await CollectionInfo.findOne({ name: collection });
    if (!collectionInfo) {
      return res.status(404).json({ error: "Collection não encontrada" });
    }
    
    // Excluir informações da collection
    await CollectionInfo.findOneAndDelete({ name: collection });
    
    // Excluir a collection de tarefas
    const Model = getTarefaModel(collection);
    await Model.collection.drop().catch(err => {
      // Ignora erro se a collection não existir (pode não ter tarefas)
      if (err.code !== 26) {
        throw err;
      }
    });
    
    res.json({ message: "Collection excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir collection:", error);
    res.status(500).json({ error: "Erro ao excluir collection" });
  }
});

// Rota para obter todas as tarefas de uma collection
app.get("/tarefas/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    
    // Verificar se a collection existe
    const collectionExists = await CollectionInfo.findOne({ name: collection });
    if (!collectionExists) {
      return res.status(404).json({ error: "Collection não encontrada" });
    }
    
    const Model = getTarefaModel(collection);
    const tarefas = await Model.find().sort({ dataCriacao: -1 });
    res.json(tarefas);
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    res.status(500).json({ error: "Erro ao buscar tarefas" });
  }
});

// Rota para adicionar uma nova tarefa
app.post("/tarefas/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    const { descricao } = req.body;
    
    if (!descricao) {
      return res.status(400).json({ error: "Descrição é obrigatória" });
    }
    
    // Verificar se a collection existe
    const collectionExists = await CollectionInfo.findOne({ name: collection });
    if (!collectionExists) {
      return res.status(404).json({ error: "Collection não encontrada" });
    }
    
    const Model = getTarefaModel(collection);
    const novaTarefa = new Model({ descricao });
    await novaTarefa.save();
    
    res.status(201).json(novaTarefa);
  } catch (error) {
    console.error("Erro ao adicionar tarefa:", error);
    res.status(500).json({ error: "Erro ao adicionar tarefa" });
  }
});

// Rota para marcar uma tarefa como concluída/não concluída
app.patch("/tarefas/:collection/:id", async (req, res) => {
  try {
    const { collection, id } = req.params;
    const { concluida } = req.body;
    
    // Verificar se a collection existe
    const collectionExists = await CollectionInfo.findOne({ name: collection });
    if (!collectionExists) {
      return res.status(404).json({ error: "Collection não encontrada" });
    }
    
    const Model = getTarefaModel(collection);
    const tarefa = await Model.findByIdAndUpdate(
      id, 
      { concluida }, 
      { new: true }
    );
    
    if (!tarefa) {
      return res.status(404).json({ error: "Tarefa não encontrada" });
    }
    
    res.json(tarefa);
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    res.status(500).json({ error: "Erro ao atualizar tarefa" });
  }
});

// Rota para excluir uma tarefa
app.delete("/tarefas/:collection/:id", async (req, res) => {
  try {
    const { collection, id } = req.params;
    
    // Verificar se a collection existe
    const collectionExists = await CollectionInfo.findOne({ name: collection });
    if (!collectionExists) {
      return res.status(404).json({ error: "Collection não encontrada" });
    }
    
    const Model = getTarefaModel(collection);
    const tarefa = await Model.findByIdAndDelete(id);
    
    if (!tarefa) {
      return res.status(404).json({ error: "Tarefa não encontrada" });
    }
    
    res.json({ message: "Tarefa excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error);
    res.status(500).json({ error: "Erro ao excluir tarefa" });
  }
});

// Rota para obter todas as cores pastel disponíveis
app.get("/colors", (req, res) => {
  res.json({ colors: coresPastel });
});


app.patch("/collections/:collection/resetDaily", async (req, res) => {
  try {
    const { collection } = req.params;
    const { resetDaily } = req.body;
    
    const collectionInfo = await CollectionInfo.findOneAndUpdate(
      { name: collection },
      { resetDaily },
      { new: true }
    );
    
    if (!collectionInfo) {
      return res.status(404).json({ error: "Collection não encontrada" });
    }
    
    res.json(collectionInfo);
  } catch (error) {
    console.error("Erro ao atualizar opção de reset diário:", error);
    res.status(500).json({ error: "Erro ao atualizar opção de reset diário" });
  }
});

async function resetDailyTasks() {
  try {
    // Buscar todas as collections com resetDaily habilitado
    const collectionsToReset = await CollectionInfo.find({ resetDaily: true });
    
    for (const collection of collectionsToReset) {
      const Model = getTarefaModel(collection.name);
      
      // Resetar todas as tarefas concluídas
      await Model.updateMany(
        { concluida: true },
        { concluida: false }
      );
      
      console.log(`Tarefas resetadas para collection: ${collection.name}`);
    }
  } catch (error) {
    console.error("Erro ao resetar tarefas diárias:", error);
  }
}

// Agendar reset diário para executar à meia-noite todos os dias
const scheduleReset = () => {
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // próximo dia
    0, 0, 0 // meia-noite
  );
  
  const msToMidnight = night.getTime() - now.getTime();
  
  // Agendar primeira execução
  setTimeout(() => {
    resetDailyTasks();
    // Depois agendar para executar diariamente
    setInterval(resetDailyTasks, 24 * 60 * 60 * 1000);
  }, msToMidnight);
  
  console.log(`Reset diário agendado para executar em ${Math.round(msToMidnight / 1000 / 60)} minutos`);
};

app.use(express.static("public"));


// Iniciar o agendamento
scheduleReset();



// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

