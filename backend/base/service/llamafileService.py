import os
import json
import subprocess
import random
import traceback
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..models import Quiz, Question

# Category specific question templates
CATEGORY_TEMPLATES = {
    'world history': [
        {
            "question": "Which ancient civilization built the Great Pyramid of Giza?",
            "options": ["Egyptian", "Mesopotamian", "Indus Valley", "Mayan"],
            "correct_option_index": 0
        },
        {
            "question": "Which empire was ruled by Genghis Khan in the 13th century?",
            "options": ["Roman Empire", "Ottoman Empire", "Mongol Empire", "Byzantine Empire"],
            "correct_option_index": 2
        },
        {
            "question": "The French Revolution began in what year?",
            "options": ["1789", "1776", "1804", "1812"],
            "correct_option_index": 0
        },
        {
            "question": "Which of these countries was NOT part of the Allied Powers during World War II?",
            "options": ["United States", "Soviet Union", "Italy", "Great Britain"],
            "correct_option_index": 2
        },
        {
            "question": "Who was the first Emperor of China?",
            "options": ["Qin Shi Huang", "Sun Yat-sen", "Kublai Khan", "Mao Zedong"],
            "correct_option_index": 0
        },
        {
            "question": "The Magna Carta was signed in which country?",
            "options": ["France", "England", "Germany", "Italy"],
            "correct_option_index": 1
        },
        {
            "question": "Which of these events happened first?",
            "options": ["The American Civil War", "The French Revolution", "World War I", "The Russian Revolution"],
            "correct_option_index": 1
        },
        {
            "question": "Who was the first woman to win a Nobel Prize?",
            "options": ["Marie Curie", "Mother Teresa", "Rosalind Franklin", "Florence Nightingale"],
            "correct_option_index": 0
        },
        {
            "question": "The Berlin Wall fell in what year?",
            "options": ["1989", "1991", "1979", "1985"],
            "correct_option_index": 0
        },
        {
            "question": "Which ancient wonder was located in Alexandria?",
            "options": ["The Hanging Gardens", "The Lighthouse (Pharos)", "The Colossus of Rhodes", "The Temple of Artemis"],
            "correct_option_index": 1
        }
    ],
    'harry potter': [
        {
            "question": "What is Harry Potter's Patronus?",
            "options": ["Stag", "Doe", "Wolf", "Phoenix"],
            "correct_option_index": 0
        },
        {
            "question": "Which Hogwarts house does Harry Potter belong to?",
            "options": ["Gryffindor", "Slytherin", "Hufflepuff", "Ravenclaw"],
            "correct_option_index": 0
        },
        {
            "question": "Who is the Half-Blood Prince?",
            "options": ["Sirius Black", "Remus Lupin", "Severus Snape", "Tom Riddle"],
            "correct_option_index": 2
        },
        {
            "question": "What is the core of Harry Potter's wand?",
            "options": ["Dragon Heartstring", "Phoenix Feather", "Unicorn Hair", "Basilisk Fang"],
            "correct_option_index": 1
        },
        {
            "question": "Who killed Albus Dumbledore?",
            "options": ["Draco Malfoy", "Severus Snape", "Bellatrix Lestrange", "Lord Voldemort"],
            "correct_option_index": 1
        },
        {
            "question": "What is the name of Harry Potter's owl?",
            "options": ["Errol", "Hedwig", "Pigwidgeon", "Crookshanks"],
            "correct_option_index": 1
        },
        {
            "question": "Which of these is NOT a Deathly Hallow?",
            "options": ["The Elder Wand", "The Resurrection Stone", "The Invisibility Cloak", "The Sword of Gryffindor"],
            "correct_option_index": 3
        },
        {
            "question": "What is Voldemort's real name?",
            "options": ["Tom Marvolo Riddle", "Gellert Grindelwald", "Marvolo Gaunt", "Salazar Slytherin"],
            "correct_option_index": 0
        },
        {
            "question": "Which of these characters is NOT a Hogwarts founder?",
            "options": ["Godric Gryffindor", "Helga Hufflepuff", "Merlin", "Rowena Ravenclaw"],
            "correct_option_index": 2
        },
        {
            "question": "What position does Harry play in Quidditch?",
            "options": ["Keeper", "Seeker", "Beater", "Chaser"],
            "correct_option_index": 1
        }
    ],
}

def generate_quiz_questions(request):
    """
    Generate quiz questions using pre-built templates or random generation
    """
    topic = request.GET.get('topic', 'General Knowledge').lower()
    num_questions = int(request.GET.get('num_questions', 5))
    
    # Create a new quiz
    quiz = Quiz.objects.create(
        title=f"Quiz on {topic.title()}",
        description=f"A quiz about {topic.title()} generated for you"
    )
    
    # Generate questions 
    questions = get_questions_for_topic(topic, num_questions)
    
    # Save questions to database
    for q_data in questions:
        question = Question.objects.create(
            quiz=quiz,
            text=q_data['question'],
            option1=q_data['options'][0],
            option2=q_data['options'][1],
            option3=q_data['options'][2],
            option4=q_data['options'][3],
            correct_option=q_data['correct_option_index'] + 1  # Convert 0-index to 1-index
        )
    
    # Return the quiz data
    return JsonResponse({
        'quiz_id': quiz.id,
        'title': quiz.title,
        'description': quiz.description,
        'questions': [
            {
                'id': q.id,
                'text': q.text,
                'options': [q.option1, q.option2, q.option3, q.option4],
                # Don't send correct answer to frontend until user submits their answer
            } for q in quiz.questions.all()
        ]
    })

def get_questions_for_topic(topic, num_questions):
    """
    Get questions for a specific topic from templates or generate them
    """
    # Check if we have templates for this topic
    templates = CATEGORY_TEMPLATES.get(topic.lower(), [])
    
    if templates and len(templates) >= num_questions:
        # Return a random selection of template questions
        return random.sample(templates, num_questions)
    else:
        # Generate generic questions for the topic
        return create_questions_for_topic(topic, num_questions)

def create_questions_for_topic(topic, num_questions):
    """
    Create quiz questions for a given topic
    """
    questions = []
    
    # Common question templates
    question_templates = [
        f"Which of these is most closely associated with {topic}?",
        f"Who is considered a pioneer in the field of {topic}?",
        f"What is a key principle of {topic}?",
        f"Which event was most significant in the development of {topic}?",
        f"Which of these books is about {topic}?",
        f"What year was a major breakthrough in {topic}?",
        f"Which country is most known for contributions to {topic}?",
        f"What tool or technology is most important in {topic}?",
        f"Which term is most closely related to {topic}?",
        f"What is the primary goal of {topic}?"
    ]
    
    for i in range(num_questions):
        # Select a question template and create options
        question_text = question_templates[i % len(question_templates)]
        
        options = [
            f"Option A related to {topic}",
            f"Option B related to {topic}",
            f"Option C related to {topic}",
            f"Option D related to {topic}"
        ]
        
        question = {
            "question": question_text,
            "options": options,
            "correct_option_index": random.randint(0, 3)
        }
        
        questions.append(question)
    
    return questions

def get_quiz_by_id(request, quiz_id):
    """
    Get a quiz by ID
    """
    try:
        quiz = Quiz.objects.get(id=quiz_id)
        return JsonResponse({
            'quiz_id': quiz.id,
            'title': quiz.title,
            'description': quiz.description,
            'questions': [
                {
                    'id': q.id,
                    'text': q.text,
                    'options': [q.option1, q.option2, q.option3, q.option4],
                } for q in quiz.questions.all()
            ]
        })
    except Quiz.DoesNotExist:
        return JsonResponse({'error': 'Quiz not found'}, status=404)

@csrf_exempt
def check_answers(request, quiz_id):
    """
    Check the answers for a quiz
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)
    
    try:
        quiz = Quiz.objects.get(id=quiz_id)
        data = json.loads(request.body)
        user_answers = data.get('answers', {})
        
        results = []
        correct_count = 0
        
        for question in quiz.questions.all():
            question_id = str(question.id)
            if question_id in user_answers:
                user_answer = int(user_answers[question_id])
                is_correct = user_answer == question.correct_option
                
                if is_correct:
                    correct_count += 1
                
                results.append({
                    'question_id': question.id,
                    'correct_option': question.correct_option,
                    'user_answer': user_answer,
                    'is_correct': is_correct
                })
        
        score = int((correct_count / quiz.questions.count()) * 100)
        
        return JsonResponse({
            'quiz_id': quiz.id,
            'results': results,
            'score': score,
            'correct_count': correct_count,
            'total_questions': quiz.questions.count()
        })
        
    except Quiz.DoesNotExist:
        return JsonResponse({'error': 'Quiz not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 