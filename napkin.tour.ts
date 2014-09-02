/// <reference path="typings/jquery/jquery.d.ts"/>

module Napkin.Tour {

    export enum ArrowDirection { N, NE, E, SE, S, SW, W, NW }

    export class TourSequence {
        private _tourSteps: Array<TourStep>;
        private _exitTourImage: ExitTourImage;

        constructor(exitTourImage?: ExitTourImage) {
            this._tourSteps = new Array<TourStep>();
            this._exitTourImage = exitTourImage;
        }

        public addStep(step: TourStep) {
            this._tourSteps.push(step);
        }

        public nextStep(): TourStep {
            return this._tourSteps.shift();
        }

        public hasNextStep(): boolean {
            return this._tourSteps.length > 0;
        }

        public startTour() {
            var self = this;

            if (self.hasNextStep()) {
                var tourOverlay = $('<div id="napkinTourOverlay" style="filter: alpha(opacity=80)"></div>').appendTo('body');
                var img = $('<img class="tourImage"></img>').appendTo(tourOverlay);
                var closeImg = $('<img id="napkinTourClose"></img>').appendTo(tourOverlay);

                var isExitTourImageDefined = typeof self._exitTourImage !== 'undefined' && self._exitTourImage !== null;

                // if the call defined an exit image, place it on the screen and bind a click event to cancel the tour
                if (isExitTourImageDefined) {

                    closeImg.attr('src', self._exitTourImage.imageHolder.imagePath);
                    closeImg.css('height', self._exitTourImage.imageHolder.height);
                    closeImg.css('width', self._exitTourImage.imageHolder.width);
                    closeImg.css('top', self._exitTourImage.exitTourOffsetCoordinates.y);
                    closeImg.css('left', self._exitTourImage.exitTourOffsetCoordinates.x);

                    closeImg.show();

                    closeImg.click((e) => {
                        e.stopPropagation();
                        tourOverlay.fadeOut(800);
                    });
                }

                // keep people from dragging the images around
                $(img).on('dragstart', (event) => { event.preventDefault(); });
                $(closeImg).on('dragstart', (event) => { event.preventDefault(); });

                var tourStep = self.nextStep();
                tourStep.show();

                tourOverlay.fadeIn(800).promise().done(() => {

                    // bind window resize function to recalculate the current tourstep

                    var showStep = () => { tourStep.show(); };
                    $(window).resize(showStep);

                    // bind the click to pop the rest of the tour sequences after the first
                    tourOverlay.click(() => {

                        // if there's another sequence, hide the old one before exposing the new one.
                        if (self.hasNextStep()) {

                            var hideExitImage = isExitTourImageDefined && !self._exitTourImage.isVisibleAfterFirstStep;
                            if (hideExitImage) {
                                closeImg.animate({ opacity: "0" }, 300).promise().done(() => {
                                    closeImg.hide();
                                });
                            }

                            $(tourStep.controlToHighlight).first().removeClass('napkintour-expose');
                            tourStep = self.nextStep();

                            // fade out the existing slide
                            img.fadeOut(300, () => {
                                tourStep.show();
                            });

                        } else {
                            $(tourStep.controlToHighlight).first().removeClass('napkintour-expose');
                            $(window).unbind('resize', showStep);
                            // tour is over, go home
                            tourOverlay.fadeOut(800);
                        }
                    });
                });
            }
        }
    }

    export class TourStep {

        public controlToHighlight: string;
        public imageHolder: ImageHolder;
        public arrowDirection: ArrowDirection;
        public arrowPointCoordinates: Coordinate;

        constructor(controlToHighlight, imageHolder: ImageHolder, arrowDirection: ArrowDirection, arrowPointCoordinates: Coordinate) {
            this.controlToHighlight = controlToHighlight;
            this.imageHolder = imageHolder;
            this.arrowDirection = arrowDirection;
            this.arrowPointCoordinates = arrowPointCoordinates;
        }

        public show() {
            var control = $(this.controlToHighlight).first();
            control.addClass('napkintour-expose');

            var image = $('.tourImage');

            if (this.imageHolder !== null) {

                image.attr('src', this.imageHolder.imagePath);
                image.css('height', this.imageHolder.height);
                image.css('width', this.imageHolder.width);

                var offset = TourStep.calculateImagePosition(image, control, this.arrowDirection, this.arrowPointCoordinates);

                if (typeof offset !== 'undefined' && offset !== null) {
                    image.css('left', offset.left);
                    image.css('top', offset.top);
                }

                image.fadeIn(300);
            }
        }

        private static calculateImagePosition(image, control, pointerDirection?: ArrowDirection, pointerCoord?: Coordinate, distanceBetween?: number): IOffset {
            var offset = { left: 0, top: 0 };

            // default the distance between to be something "nice" if none is specified
            // this is important since nothing ever specifies it right now!
            distanceBetween = typeof distanceBetween !== 'undefined' && distanceBetween !== null ? distanceBetween : 20;

            var imageWidth = image.width();
            var imageHeight = image.height();

            var controlHasOffset = typeof control.offset() !== 'undefined' && control.offset() !== null;
            var pointerCoordDefined = typeof pointerCoord !== 'undefined' && pointerCoord !== null;

            // determine the offsets for the edges of the control
            var leftEdge = controlHasOffset ? control.offset().left : 0;
            var rightEdge = leftEdge + control.outerWidth();
            var topEdge = controlHasOffset ? control.offset().top : 0;
            var bottomEdge = topEdge + control.outerHeight();
            var xMiddlePoint = controlHasOffset ? control.offset().left + control.outerWidth() / 2 : 0;
            var yMiddlePoint = controlHasOffset ? control.offset().top + control.outerHeight() / 2 : 0;

            var pointerY = 0;
            var pointerX = 0;

            switch (pointerDirection) {
                case ArrowDirection.NE:

                    pointerY = pointerCoordDefined ? pointerCoord.y : 0;
                    pointerX = pointerCoordDefined ? pointerCoord.x : imageWidth;

                    offset.left = leftEdge - pointerX;
                    offset.top = bottomEdge - pointerY / 2;

                    break;

                case ArrowDirection.NW:

                    pointerY = pointerCoordDefined ? pointerCoord.y : 0;
                    pointerX = pointerCoordDefined ? pointerCoord.x : 0;

                    offset.left = leftEdge + imageWidth + pointerX;
                    offset.top = bottomEdge - pointerY / 2;
                    break;

                case ArrowDirection.SE:

                    pointerY = pointerCoordDefined ? pointerCoord.y : imageHeight;
                    pointerX = pointerCoordDefined ? pointerCoord.x : imageWidth;

                    offset.left = leftEdge - pointerX;
                    offset.top = topEdge - imageHeight + pointerY / 2;
                    break;

                case ArrowDirection.SW:

                    pointerY = pointerCoordDefined ? pointerCoord.y : imageHeight;
                    pointerX = pointerCoordDefined ? pointerCoord.x : 0;

                    offset.left = rightEdge + imageWidth + pointerX;
                    offset.top = topEdge - imageHeight + pointerY / 2;
                    break;

                case ArrowDirection.N:

                    pointerY = pointerCoordDefined ? pointerCoord.y : 0;
                    pointerX = pointerCoordDefined ? pointerCoord.x : imageWidth / 2;

                    offset.left = xMiddlePoint - pointerX;
                    offset.top = bottomEdge - pointerY + distanceBetween;

                    break;

                case ArrowDirection.S:

                    pointerY = pointerCoordDefined ? pointerCoord.y : bottomEdge;
                    pointerX = pointerCoordDefined ? pointerCoord.x : imageWidth / 2;

                    offset.left = xMiddlePoint - pointerX;
                    offset.top = topEdge - imageHeight + pointerY - distanceBetween;

                    break;

                case ArrowDirection.E:

                    pointerY = pointerCoordDefined ? pointerCoord.y : imageHeight / 2;
                    pointerX = pointerCoordDefined ? pointerCoord.x : imageWidth;

                    offset.left = leftEdge - pointerX - distanceBetween;
                    offset.top = yMiddlePoint - pointerY;

                    break;

                case ArrowDirection.W:

                    pointerY = pointerCoordDefined ? pointerCoord.y : imageHeight / 2;
                    pointerX = pointerCoordDefined ? pointerCoord.x : 0;

                    offset.left = rightEdge - pointerX + distanceBetween;
                    offset.top = yMiddlePoint - pointerY;
                    break;

                default:

                    offset.left = pointerCoordDefined ? pointerCoord.x : 0;
                    offset.top = pointerCoordDefined ? pointerCoord.y : 0;

            }

            return offset;
        }
    }

    export class ImageHolder {

        public imagePath: string;
        public height: number;
        public width: number;

        constructor(imagePath: string, width: number, height: number) {
            this.imagePath = imagePath;
            this.height = height;
            this.width = width;
        }
    }

    export class ExitTourImage {

        public imageHolder: ImageHolder;
        public exitTourOffsetCoordinates: Coordinate;
        public isVisibleAfterFirstStep: boolean;

        constructor(imageHolder: ImageHolder, offsetCoordinates: Coordinate, isVisibleAfterFirstStep?: boolean) {
            this.imageHolder = imageHolder;
            if (typeof offsetCoordinates !== 'undefined' && offsetCoordinates !== null) {
                this.exitTourOffsetCoordinates = offsetCoordinates;
            } else {
                this.exitTourOffsetCoordinates = new Coordinate(0, 0);
            }
            this.isVisibleAfterFirstStep = isVisibleAfterFirstStep;
        }
    }

    export class Coordinate {
        public x: number;
        public y: number;

        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
        }
    }

    interface IOffset {
        left: number;
        top: number;
    }
}