require('source-map-support').install();

const test = require('tape');
const { Document, Extension, ExtensionProperty, NodeIO, PropertyType } = require('../');

const EXTENSION_NAME = 'TEST_node_gizmo';

class GizmoExtension extends Extension {
	constructor(doc) {
		super(doc);
		this.extensionName = EXTENSION_NAME;
	}

	createGizmo() {
		return new Gizmo(this.doc.getGraph(), this);
	}

	write(context) {
		for (const node of this.doc.getRoot().listNodes()) {
			if (node.getExtension(EXTENSION_NAME)) {
				const nodeDef = context.jsonDoc.json.nodes[context.nodeIndexMap.get(node)];
				nodeDef.extensions = {TEST_node_gizmo: {isGizmo: true}};
			}
		}
	}

	read(context) {
		context.jsonDoc.json.nodes.forEach((nodeDef, index) => {
			const extensionDef = nodeDef.extensions && nodeDef.extensions.TEST_node_gizmo;
			if (!extensionDef || !extensionDef.isGizmo) return;
			const extension = this.doc.createExtension(GizmoExtension);
			context.nodes[index].setExtension(EXTENSION_NAME, extension.createGizmo());
		});
	}
}

class Gizmo extends ExtensionProperty {
	constructor(graph, extension) {
		super(graph, extension);
		this.extensionName = EXTENSION_NAME;
		this.propertyType = 'Gizmo';
		this.parentTypes = [PropertyType.NODE];
	}
}

GizmoExtension.EXTENSION_NAME = EXTENSION_NAME;
Gizmo.EXTENSION_NAME = EXTENSION_NAME;

test('@gltf-transform/core::extension | list', t => {
	const doc = new Document();
	const extension = doc.createExtension(GizmoExtension);

	t.deepEqual(doc.getRoot().listExtensionsUsed(), [extension], 'listExtensionsUsed()');
	t.deepEqual(doc.getRoot().listExtensionsRequired(), [], 'listExtensionsRequired()');

	extension.setRequired(true);
	t.deepEqual(doc.getRoot().listExtensionsRequired(), [extension], 'listExtensionsRequired()');

	extension.dispose();
	t.deepEqual(doc.getRoot().listExtensionsUsed(), [], 'listExtensionsUsed()');
	t.deepEqual(doc.getRoot().listExtensionsRequired(), [], 'listExtensionsRequired()');

	t.end();
});

test('@gltf-transform/core::extension | property', t => {
	const doc = new Document();
	const extension = doc.createExtension(GizmoExtension);
	const gizmo = extension.createGizmo();
	const node = doc.createNode();

	t.equal(node.getExtension(EXTENSION_NAME), null, 'getExtension() → null (1)');

	// Add ExtensionProperty.

	node.setExtension(EXTENSION_NAME, gizmo);
	t.equal(node.getExtension(EXTENSION_NAME), gizmo, 'getExtension() → gizmo');
	t.deepEqual(node.listExtensions(), [gizmo], 'listExtensions() → [gizmo x1]');

	// Remove ExtensionProperty.

	node.setExtension(EXTENSION_NAME, null);
	t.equal(node.getExtension(EXTENSION_NAME), null, 'getExtension() → null (2)');

	// Dispose ExtensionProperty.

	node.setExtension(EXTENSION_NAME, gizmo);
	gizmo.dispose();
	t.equal(node.getExtension(EXTENSION_NAME), null, 'getExtension() → null (3)');

	// Dispose Extension.

	node.setExtension(EXTENSION_NAME, extension.createGizmo());
	extension.dispose();
	t.equal(node.getExtension(EXTENSION_NAME), null, 'getExtension() → null (4)');

	t.end();
});


test('@gltf-transform/core::extension | i/o', t => {
	const io = new NodeIO().registerExtensions([GizmoExtension]);
	const doc = new Document();
	const extension = doc.createExtension(GizmoExtension);
	doc.createNode().setExtension(EXTENSION_NAME, extension.createGizmo());

	const options = {basename: 'extensionTest'};

	let jsonDoc;
	let resultDoc;

	// Write.

	jsonDoc = io.writeJSON(doc, options);
	t.deepEqual(jsonDoc.json.extensionsUsed, ['TEST_node_gizmo'], 'write extensionsUsed');
	t.equal(jsonDoc.json.extensionsRequired, undefined, 'omit extensionsRequired');
	t.equal(jsonDoc.json.nodes[0].extensions.TEST_node_gizmo.isGizmo, true, 'extend node');

	// Read.

	resultDoc = io.readJSON(jsonDoc);
	t.deepEqual(
		resultDoc.getRoot().listExtensionsUsed().map((ext) => ext.extensionName),
		['TEST_node_gizmo'],
		'roundtrip extensionsUsed'
	);
	t.deepEqual(resultDoc.getRoot().listExtensionsRequired(), [], 'roundtrip omit extensionsRequired');
	t.equal(resultDoc.getRoot().listNodes()[0].getExtension(EXTENSION_NAME).extensionName, 'TEST_node_gizmo', 'roundtrip extend node');

	// Write + read with extensionsRequired.

	extension.setRequired(true);
	jsonDoc = io.writeJSON(doc, options);
	t.deepEqual(jsonDoc.json.extensionsRequired, ['TEST_node_gizmo'], 'write extensionsRequired');
	resultDoc = io.readJSON(jsonDoc);
	t.deepEqual(
		resultDoc.getRoot().listExtensionsRequired().map((ext) => ext.extensionName),
		['TEST_node_gizmo'],
		'roundtrip extensionsRequired'
	);

	t.end();
});
