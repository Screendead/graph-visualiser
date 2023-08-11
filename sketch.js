const grid = 48;
let randomise = false;

class Node {
    static nodesById = {};

    constructor(x, y) {
        this.id = Object.keys(Node.nodesById).length.toString();

        this.x = round(x / grid) * grid;
        this.y = round(y / grid) * grid;
        this.r = grid / 3;

        this.dragging = false;

        for (let i = 0; i < Node.nodes.length; i++) {
            if (Node.nodes[i].id === this.id) {
                delete Node.nodes[i];
                console.log('Deleted node with same id');
                continue;
            }

            new Edge(this, Node.nodes[i]);
        }

        Node.nodesById[this.id] = this;
    }

    static get(id) {
        return this.nodes[id];
    }

    static get nodes() {
        return Object.values(this.nodesById);
    }

    show() {
        stroke(255);
        strokeWeight(2);
        fill(255);
        ellipse(this.x, this.y, this.r * 2);
    }
}

class Edge {
    static edgesById = {};

    constructor(node1, node2, id) {
        if (!node1 || !node2) {
            throw new Error('Edge must have two nodes');
        }

        this.id = id || [node1.id, node2.id].sort().join(':');
        Edge.edgesById[this.id] = this;

        this.node1 = node1;
        this.node2 = node2;
    }

    static get(id) {
        return this.edges[id];
    }

    static get edges() {
        return Object.values(this.edgesById);
    }

    static getEdgesForNode(node) {
        return this.edges.filter(edge => edge.node1.id === node.id || edge.node2.id === node.id);
    }

    show() {
        // Check if the mouse is hovering over this edge
        if (
            this.node1.dragging
            || this.node2.dragging
            || dist(mouseX, mouseY, this.node1.x, this.node1.y) < this.node1.r
            || dist(mouseX, mouseY, this.node2.x, this.node2.y) < this.node2.r
        ) {
            stroke(255, 255, 255, 255);
            strokeWeight(4);
        } else {
            stroke(255, 255, 255, 50);
            strokeWeight(2);
        }

        line(this.node1.x, this.node1.y, this.node2.x, this.node2.y);
    }
}

function preload() {
    const nodes = JSON.parse(localStorage.getItem('nodes'));
    const edges = JSON.parse(localStorage.getItem('edges'));

    if (nodes) {
        Object.values(nodes).forEach(node => new Node(node.x, node.y, node.id));
    }

    if (edges) {
        Object.values(edges).forEach(edge => new Edge(Node.nodesById[edge.node1.id], Node.nodesById[edge.node2.id], edge.id));
    }

    console.log('Loaded nodes and edges from localStorage');
}

function setup() {
    createCanvas(innerWidth, innerHeight);
    select('canvas').elt.style.touchAction = 'none'; // Disable panning on mobile
    select('canvas').elt.addEventListener('touchmove', e => e.preventDefault()); // Disable scrolling on mobile
    select('canvas').elt.addEventListener('contextmenu', e => e.preventDefault()); // Disable right click menu
}

function draw() {
    background(0);

    if (randomise) {
        Node.nodes.forEach(node => {
            node.x = round((node.x + random(-grid, grid)) / grid) * grid;
            node.y = round((node.y + random(-grid, grid)) / grid) * grid;
        });
    }

    // Draw grid
    stroke(255, 255, 255, 50);
    strokeWeight(1);
    for (let x = 0; x < width; x += grid) {
        line(x, 0, x, height);
    }
    for (let y = 0; y < height; y += grid) {
        line(0, y, width, y);
    }

    Node.nodes.forEach(node => node.show());
    Edge.edges.forEach(edge => edge.show());

    // Show FPS
    fill(255);
    noStroke();
    text(`${frameRate().toFixed(2)} fps`, 10, 20);

    // Show number of nodes
    text(`Nodes: ${Node.nodes.length}`, 10, 40);

    // Show number of edges
    text(`Edges: ${Edge.edges.length}`, 10, 60);

    // Show number of edges for each node
    Node.nodes.forEach((node, i) => {
        if (node.dragging) {
            fill(255, 0, 0);
        } else {
            fill(255);
        }

        text(`${node.id}: ${Edge.getEdgesForNode(node).length}`, 10, 80 + i * 20);
    });

    // Once a second, save the current state to localStorage
    if (frameCount % 60 === 0) {
        localStorage.setItem('nodes', JSON.stringify(Node.nodesById));
        localStorage.setItem('edges', JSON.stringify(Edge.edgesById));
    }
}

function mousePressed() {
    const node = Node.nodes.find(node => dist(node.x, node.y, mouseX, mouseY) < node.r);

    if (node) {
        if (mouseButton === LEFT) {
            node.dragging = true;
        } else if (mouseButton === RIGHT) {
            Edge.getEdgesForNode(node).forEach(edge => delete Edge.edgesById[edge.id]);
            delete Node.nodesById[node.id];
        }
    } else {
        new Node(mouseX, mouseY);
    }
}

function mouseDragged() {
    const node = Node.nodes.find(node => node.dragging);

    if (node) {
        node.x = round(mouseX / grid) * grid;
        node.y = round(mouseY / grid) * grid;
    } else {
        new Node(mouseX, mouseY);
    }
}

function mouseReleased() {
    const node = Node.nodes.find(node => node.dragging);

    if (node) {
        node.dragging = false;
    }
}

function mouseWheel(event) {
    const node = Node.nodes.find(node => dist(node.x, node.y, mouseX, mouseY) < node.r);

    if (node) {
        node.r += event.delta;
    }
}

function windowResized() {
    resizeCanvas(innerWidth, innerHeight);
}

function keyPressed() {
    if (keyCode === 32) {
        // Spacebar
        randomise = true;
    } else if (keyCode === 8) {
        // Backspace
        localStorage.clear();
        location.reload();
    }
}

function keyReleased() {
    if (keyCode === 32) {
        // Spacebar
        randomise = false;
    }
}