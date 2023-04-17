import type { PyodideInterface } from "$lib/types/pyodide";

export function applyMatplotlibPatch(pyodide: PyodideInterface) {
    console.debug("Applying patch for matplotlib")
    try {
        pyodide.runPython(`
import matplotlib
import matplotlib.pyplot as plt
from js import drawDOMCanvas

matplotlib.use('AGG')

def show():
    canvas = plt.gcf().canvas
    canvas.draw()
    width, height = canvas.get_width_height()
    pixels = canvas.buffer_rgba().tobytes()
    drawDOMCanvas(pixels, height, width)
    matplotlib.pyplot.clf()

matplotlib.pyplot.show = show
                `)
    } catch (e: unknown) {
        console.error(`Patching has failed with error: ${e}`)
    }
}
