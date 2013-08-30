(function(){

    window.Transcripts = window.Transcripts || {};


    Transcripts.Utils = (function(){

        // These are the types of URLs supported:
        // http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index
        // http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o
        // http://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0
        // http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s
        // http://www.youtube.com/embed/0zM3nApSvMg?rel=0
        // http://www.youtube.com/watch?v=0zM3nApSvMg
        // http://youtu.be/0zM3nApSvMg
        var _youtubeParser = (function() {
            var cache = {};

            return function(url) {
                if (cache[url]) {
                    return cache[url];
                }

                var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
                var match = url.match(regExp);
                cache[url] = (match && match[1].length === 11) ? match[1] : false;

                return cache[url];
            };
        }());

        var _videoLinkParser = (function() {
            var cache = {};

            return function (url) {
                if (cache[url]) {
                    return cache[url];
                }

                var link = document.createElement('a'),
                    result = false,
                    match;

                link.href = url;
                match = link.pathname
                            .split('/')
                            .pop()
                            .match(/(.+)\.(mp4|webm)$/);

                if (match) {
                    cache[url] = {
                        name: match[1],
                        format: match[2]
                    }
                }

                return cache[url];
            };
        }());

        var _linkParser = function(url){
            var result;

            if (typeof url !== "string") {
                console.log("Transcripts.Utils.parseLink");
                console.log("TypeError: Wrong argument type.");

                return false;
            }

            if (_youtubeParser(url)) {
                result = {
                    type: 'youtube',
                    data: _youtubeParser(url)
                };
            } else if (_videoLinkParser(url)) {
                result = {
                    type: 'html5',
                    data: _videoLinkParser(url)
                };
            } else {
                result = {
                    type: 'incorrect'
                };
            }

            return result;
        };

        var _getYoutubeLink = function(video_id){
            return 'http://youtu.be/' + video_id;
        };

        //  TODO: Use strategy pattern
        var _setVideoUrlToBasic = function() {
            var metadataEditor = TabsEditingDescriptor.getStorage()
                                                .MetadataEditor,

                transcriptsEditor = TabsEditingDescriptor.getStorage()
                                                .Transcripts,
                result = [],

                html5_sources_value,
                youtube_id_1_0_value,
                video_url;

            if (metadataEditor && transcriptsEditor) {
                html5_sources_value = _getField(
                                            metadataEditor.collection,
                                            'html5_sources'
                                        )
                                        .getDisplayValue();

                youtube_id_1_0_value = _getField(
                                            metadataEditor.collection,
                                            'youtube_id_1_0'
                                        )
                                        .getDisplayValue();

                video_url = _getField(
                                transcriptsEditor.collection,
                                'video_url'
                            );


                if (youtube_id_1_0_value !== null) {
                    result.push(
                        _getYoutubeLink(youtube_id_1_0_value)
                    );
                }

                result = result.concat(html5_sources_value);

                video_url.setValue(result);
            }
        };

        var _setVideoUrlToAdvanced = function() {
            var metadataEditor = TabsEditingDescriptor.getStorage()
                                                .MetadataEditor,
                transcriptsEditor = TabsEditingDescriptor.getStorage()
                                                .Transcripts,
                html5_sources,
                youtube_id_1_0,
                html5_sources_value,
                youtube_id_1_0_value,
                video_url_value,
                result;

                if (metadataEditor && transcriptsEditor) {
                    html5_sources = _getField(
                                        metadataEditor.collection,
                                        'html5_sources'
                                    );

                    youtube_id_1_0 = _getField(
                                        metadataEditor.collection,
                                        'youtube_id_1_0'
                                    );

                    video_url_value = _getField(
                                        transcriptsEditor.collection,
                                        'video_url'
                                    )
                                    .getDisplayValue();

                    result = _.groupBy(
                        video_url_value,
                        function(value) {
                            return _linkParser(value).type;
                        }
                    );

                    html5_sources.setValue(result['html5'] || []);

                    if (result['youtube']) {
                        youtube_id_1_0.setValue(
                            _linkParser(result['youtube'][0]).data
                        );
                    } else {
                        youtube_id_1_0.setValue('');
                    }
                }
        };

        var _getField = function(collection, field_name) {
            var model;

            if (collection && field_name) {
                model = collection.findWhere({
                    field_name: field_name
                });
            }

            return model;
        };

        var _synchronizeTabs = function (fromCollection, toCollection, type) {
            fromCollection.each(function(m) {
                var model = toCollection.findWhere({
                        field_name: m.getFieldName()
                    });

                if (model) {
                    model.setValue(m.getDisplayValue());
                }
            });

            switch (type) {
                case "basic":
                    _setVideoUrlToBasic();
                    break;
                case "advanced":
                    _setVideoUrlToAdvanced();
                    break;
            }

        };

        return {
            parseYoutubeLink: _youtubeParser,
            parseHTML5Link: _videoLinkParser,
            parseLink: _linkParser,
            synchronizeTabs: _synchronizeTabs
        }
    }());


    Transcripts.Editor = Backbone.View.extend({

        tagName: "div",

        initialize: function() {
            var self = this,
                metadata = this.$el.data('metadata'),
                models = this.toModels(metadata);

            this.collection = new CMS.Models.MetadataCollection(models);

            this.metadataEditor = new CMS.Views.Metadata.Editor({
                el: this.$el,
                collection: this.collection
            });
        },

        render: function() {
        },

        // Convert metadata JSON to List of models
        toModels: function(data) {
            var metadata = (_.isString(data)) ? parseJSON(data) : data,
                models = [];

            for (model in metadata){
                if (metadata.hasOwnProperty(model)) {
                    models.push(metadata[model]);
                }
            }

            return models;
        }

    });


    CMS.Views.Metadata.VideoList = CMS.Views.Metadata.AbstractEditor.extend({

        events : {
            "click .setting-clear" : "clear",
            "keypress .setting-input" : "showClearButton",
            "change input" : "updateModel",
            "click .collapse-setting" : "addAdditionalVideos",
            "input input" : "checkValidity"
        },

        templateName: "metadata-videolist-entry",

        initialize: function() {
            var self = this;

            CMS.Views.Metadata.AbstractEditor.prototype.initialize
                .apply(this, arguments);
        },

        getValueFromEditor: function () {
            return _.map(
                this.$el.find('.input'),
                function (ele) { return ele.value.trim(); }
            ).filter(_.identity);
        },

        // TODO: Think about mehtod of creation
        setValueInEditor: function (value) {

            var list = this.$el.find('ol'),
                url = this.$el.find('.wrapper-videolist-url input');

            list.empty();

            _.each(value, function(ele, index) {
                if (index != 0) {
                    var template = _.template(
                        '<li class="videolist-settings-item">' +
                            '<input type="text" class="input" value="<%= ele %>">' +
                        '</li>'
                    );
                    list.append($(template({'ele': ele, 'index': index})));
                }
            });
            url.val(value[0]);
        },

        addAdditionalVideos: function(event) {
            if (event && event.preventDefault) {
                event.preventDefault();
            }

            this.$el.find('.videolist-settings').addClass('is-visible');
            this.$el.find('.collapse-setting').addClass('is-disabled');
        },

        checkValidity: (function(event){
            var checker = function(event){
                var entry = $(event.currentTarget).val(),
                    data = Transcripts.Utils.parseLink(entry);

                    switch (data.type) {
                        case 'youtube':
                            this.fetchCaptions(data.data)
                                .always(function(response, statusText){
                                    if (response.status === 200) {
                                       console.log(arguments);
                                    } else {
                                        console.log('No caption!!!');
                                    }
                                });
                            break;
                        case 'html5':

                            break;
                    }

                    console.log(data)
            };

            return _.debounce(checker, 300);
        }()),

        fetchCaptions: function(video_id){
            var xhr = $.ajax({
                url: 'http://video.google.com/timedtext',
                data: {
                    lang: 'en',
                    v: video_id
                },
                timeout: 1500,
                dataType: 'jsonp'
            });

            return xhr;
        }
    });

}(this));
