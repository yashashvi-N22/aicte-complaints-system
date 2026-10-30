import re
import math
from collections import Counter
from typing import List, Tuple, Set
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.config import settings
from app.models.complaint import Complaint, ComplaintStatus
from app.models.duplicate import DuplicateSuggestion, DuplicateReviewStatus

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
    "by", "can", "did", "do", "does", "doing", "don", "down", "during", "each", "few", "for", 
    "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", 
    "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", 
    "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once", 
    "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "s", "same", "she", 
    "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", 
    "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", 
    "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", 
    "why", "will", "with", "would", "you", "your", "yours", "yourself", "yourselves", "aicte",
    "complaint", "regarding", "respect", "sir", "madam", "institution", "college", "university"
}

def clean_and_tokenize(text: str) -> List[str]:
    if not text:
        return []
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    return [w for w in words if w not in STOPWORDS]

def compute_cosine_similarity(vec1: Counter, vec2: Counter) -> float:
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum([vec1[x] * vec2[x] for x in intersection])
    
    sum1 = sum([val ** 2 for val in vec1.values()])
    sum2 = sum([val ** 2 for val in vec2.values()])
    denominator = math.sqrt(sum1) * math.sqrt(sum2)
    
    if not denominator:
        return 0.0
    return float(numerator) / denominator

def compute_jaccard_similarity(set1: Set[str], set2: Set[str]) -> float:
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    if not union:
        return 0.0
    return float(intersection) / float(union)

def calculate_text_similarity(text1: str, text2: str) -> Tuple[float, List[str]]:
    tokens1 = clean_and_tokenize(text1)
    tokens2 = clean_and_tokenize(text2)
    
    if not tokens1 or not tokens2:
        return 0.0, []
        
    vec1 = Counter(tokens1)
    vec2 = Counter(tokens2)
    
    set1 = set(tokens1)
    set2 = set(tokens2)
    
    cosine = compute_cosine_similarity(vec1, vec2)
    jaccard = compute_jaccard_similarity(set1, set2)
    
    blended_score = (0.65 * cosine) + (0.35 * jaccard)
    overlapping_words = list(set1 & set2)
    
    # Sort matching words by frequency
    overlapping_words.sort(key=lambda w: vec1[w] + vec2[w], reverse=True)
    return round(blended_score, 4), overlapping_words[:8]

def scan_duplicates_for_complaint(db: Session, complaint: Complaint) -> List[DuplicateSuggestion]:
    """
    Scans recent and existing complaints to detect potential duplicates.
    Saves suggestion in DB if similarity exceeds threshold.
    """
    # Fetch comparison pool (excluding the complaint itself)
    candidates = db.query(Complaint).filter(
        Complaint.id != complaint.id,
        Complaint.status != ComplaintStatus.REJECTED
    ).all()
    
    source_text = f"{complaint.title} {complaint.description}"
    created_suggestions: List[DuplicateSuggestion] = []
    
    for candidate in candidates:
        target_text = f"{candidate.title} {candidate.description}"
        score, matched_words = calculate_text_similarity(source_text, target_text)
        
        # Boost if same institution
        if candidate.institution_id == complaint.institution_id:
            score += 0.12
            
        # Boost if same category
        if candidate.category == complaint.category:
            score += 0.08
            
        score = min(round(score, 4), 1.0)
        
        if score >= settings.DUPLICATE_SIMILARITY_THRESHOLD:
            # Check if suggestion already exists
            existing = db.query(DuplicateSuggestion).filter(
                or_(
                    (DuplicateSuggestion.complaint_id == complaint.id) & (DuplicateSuggestion.potential_duplicate_id == candidate.id),
                    (DuplicateSuggestion.complaint_id == candidate.id) & (DuplicateSuggestion.potential_duplicate_id == complaint.id)
                )
            ).first()
            
            if not existing:
                suggestion = DuplicateSuggestion(
                    complaint_id=complaint.id,
                    potential_duplicate_id=candidate.id,
                    similarity_score=score,
                    matched_keywords=", ".join(matched_words),
                    status=DuplicateReviewStatus.PENDING
                )
                db.add(suggestion)
                created_suggestions.append(suggestion)
                
    if created_suggestions:
        db.commit()
        
    return created_suggestions
